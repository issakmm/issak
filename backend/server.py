from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

security = HTTPBearer()

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_verification_code() -> str:
    return str(secrets.randbelow(900000) + 100000)  # 6-digit code

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def is_edu_email(email: str) -> bool:
    return email.lower().endswith('.edu')

def extract_university_from_email(email: str) -> str:
    # Extract university name from .edu email
    domain = email.split('@')[1]
    parts = domain.replace('.edu', '').split('.')
    return ' '.join(parts).title()

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    city: str
    university: Optional[str] = None  # Only for .edu users

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyEmail(BaseModel):
    email: EmailStr
    code: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    university: str
    city: str
    is_verified: bool
    karma: int
    created_at: str

class PostCreate(BaseModel):
    content: str
    feed_type: str = "university"  # "university" or "city"

class PostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content: str
    feed_type: str
    university: Optional[str] = None
    city: str
    upvotes: int
    downvotes: int
    comment_count: int
    user_vote: Optional[int] = None  # 1 for upvote, -1 for downvote, None for no vote
    created_at: str
    time_ago: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    post_id: str
    content: str
    upvotes: int
    downvotes: int
    user_vote: Optional[int] = None
    created_at: str
    time_ago: str

class VoteRequest(BaseModel):
    vote: int  # 1 for upvote, -1 for downvote, 0 to remove vote

# Helper to calculate time ago
def get_time_ago(created_at: str) -> str:
    created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    diff = now - created
    
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        mins = int(seconds / 60)
        return f"{mins}m ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours}h ago"
    else:
        days = int(seconds / 86400)
        return f"{days}d ago"

# Auth Routes
@api_router.post("/auth/register")
async def register(user: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate verification code
    verification_code = generate_verification_code()
    
    # Determine if user has .edu email (gets university access)
    has_edu_email = is_edu_email(user.email)
    university = extract_university_from_email(user.email) if has_edu_email else None
    
    # Create user
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email.lower(),
        "password": hash_password(user.password),
        "university": university,
        "city": user.city,
        "has_university_access": has_edu_email,
        "is_verified": False,
        "verification_code": verification_code,
        "karma": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # In production, send email with verification code
    # For demo, return the code (would be sent via email in production)
    return {
        "message": "Registration successful. Please verify your email.",
        "verification_code": verification_code,  # Remove in production
        "email": user.email.lower()
    }

@api_router.post("/auth/verify")
async def verify_email(data: VerifyEmail):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    if user.get("verification_code") != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Update user as verified
    await db.users.update_one(
        {"email": data.email.lower()},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": ""}}
    )
    
    # Generate JWT token
    token = create_jwt_token(user["id"], user["email"])
    
    return {
        "message": "Email verified successfully",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "university": user.get("university"),
            "city": user["city"],
            "karma": user["karma"],
            "has_university_access": user.get("has_university_access", False)
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["password"] != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Please verify your email first")
    
    # Determine university access based on email (for backward compatibility)
    has_university_access = user.get("has_university_access")
    if has_university_access is None:
        has_university_access = is_edu_email(user["email"])
        # Update the user record for future logins
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"has_university_access": has_university_access}}
        )
    
    token = create_jwt_token(user["id"], user["email"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "university": user.get("university"),
            "city": user["city"],
            "karma": user["karma"],
            "has_university_access": has_university_access
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    # Determine university access based on email (for backward compatibility)
    has_university_access = current_user.get("has_university_access")
    if has_university_access is None:
        has_university_access = is_edu_email(current_user["email"])
    
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "university": current_user.get("university"),
        "city": current_user["city"],
        "karma": current_user["karma"],
        "has_university_access": has_university_access
    }

# Post Routes
@api_router.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, current_user: dict = Depends(get_current_user)):
    if len(post.content.strip()) < 1:
        raise HTTPException(status_code=400, detail="Post content cannot be empty")
    
    if len(post.content) > 500:
        raise HTTPException(status_code=400, detail="Post content cannot exceed 500 characters")
    
    post_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "content": post.content.strip(),
        "feed_type": post.feed_type,
        "university": current_user["university"] if post.feed_type == "university" else None,
        "city": current_user["city"],
        "upvotes": 0,
        "downvotes": 0,
        "comment_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(post_doc)
    
    return PostResponse(
        **{k: v for k, v in post_doc.items() if k != "_id"},
        user_vote=None,
        time_ago=get_time_ago(post_doc["created_at"])
    )

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts(
    feed_type: str = "university",
    sort: str = "new",  # "new" or "hot"
    current_user: dict = Depends(get_current_user)
):
    # Build query based on feed type
    if feed_type == "university":
        query = {"feed_type": "university", "university": current_user["university"]}
    else:
        query = {"feed_type": "city", "city": current_user["city"]}
    
    # Sort order
    if sort == "hot":
        # Hot = upvotes - downvotes, then by time
        posts_cursor = db.posts.find(query, {"_id": 0}).sort([("upvotes", -1), ("created_at", -1)]).limit(100)
    else:
        posts_cursor = db.posts.find(query, {"_id": 0}).sort("created_at", -1).limit(100)
    
    posts = await posts_cursor.to_list(100)
    
    # Get user's votes for these posts
    post_ids = [p["id"] for p in posts]
    user_votes = await db.votes.find(
        {"user_id": current_user["id"], "target_id": {"$in": post_ids}, "target_type": "post"},
        {"_id": 0}
    ).to_list(1000)
    
    vote_map = {v["target_id"]: v["vote"] for v in user_votes}
    
    result = []
    for post in posts:
        post["user_vote"] = vote_map.get(post["id"])
        post["time_ago"] = get_time_ago(post["created_at"])
        result.append(PostResponse(**post))
    
    return result

@api_router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user's vote
    user_vote = await db.votes.find_one(
        {"user_id": current_user["id"], "target_id": post_id, "target_type": "post"},
        {"_id": 0}
    )
    
    post["user_vote"] = user_vote["vote"] if user_vote else None
    post["time_ago"] = get_time_ago(post["created_at"])
    
    return PostResponse(**post)

@api_router.post("/posts/{post_id}/vote")
async def vote_post(post_id: str, vote_req: VoteRequest, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check existing vote
    existing_vote = await db.votes.find_one(
        {"user_id": current_user["id"], "target_id": post_id, "target_type": "post"}
    )
    
    upvote_delta = 0
    downvote_delta = 0
    karma_delta = 0
    
    if existing_vote:
        old_vote = existing_vote["vote"]
        if old_vote == 1:
            upvote_delta -= 1
            karma_delta -= 1
        elif old_vote == -1:
            downvote_delta -= 1
            karma_delta += 1
        
        if vote_req.vote == 0:
            await db.votes.delete_one({"_id": existing_vote["_id"]})
        else:
            await db.votes.update_one(
                {"_id": existing_vote["_id"]},
                {"$set": {"vote": vote_req.vote}}
            )
    
    if vote_req.vote != 0:
        if not existing_vote:
            await db.votes.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "target_id": post_id,
                "target_type": "post",
                "vote": vote_req.vote,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        if vote_req.vote == 1:
            upvote_delta += 1
            karma_delta += 1
        elif vote_req.vote == -1:
            downvote_delta += 1
            karma_delta -= 1
    
    # Update post vote counts
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"upvotes": upvote_delta, "downvotes": downvote_delta}}
    )
    
    # Update post author's karma
    if karma_delta != 0:
        await db.users.update_one(
            {"id": post["user_id"]},
            {"$inc": {"karma": karma_delta}}
        )
    
    updated_post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return {
        "upvotes": updated_post["upvotes"],
        "downvotes": updated_post["downvotes"],
        "user_vote": vote_req.vote if vote_req.vote != 0 else None
    }

# Comment Routes
@api_router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if len(comment.content.strip()) < 1:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    
    if len(comment.content) > 300:
        raise HTTPException(status_code=400, detail="Comment cannot exceed 300 characters")
    
    comment_doc = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": current_user["id"],
        "content": comment.content.strip(),
        "upvotes": 0,
        "downvotes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    
    # Increment comment count on post
    await db.posts.update_one({"id": post_id}, {"$inc": {"comment_count": 1}})
    
    return CommentResponse(
        **{k: v for k, v in comment_doc.items() if k != "_id"},
        user_vote=None,
        time_ago=get_time_ago(comment_doc["created_at"])
    )

@api_router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str, current_user: dict = Depends(get_current_user)):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    # Get user's votes for these comments
    comment_ids = [c["id"] for c in comments]
    user_votes = await db.votes.find(
        {"user_id": current_user["id"], "target_id": {"$in": comment_ids}, "target_type": "comment"},
        {"_id": 0}
    ).to_list(1000)
    
    vote_map = {v["target_id"]: v["vote"] for v in user_votes}
    
    result = []
    for comment in comments:
        comment["user_vote"] = vote_map.get(comment["id"])
        comment["time_ago"] = get_time_ago(comment["created_at"])
        result.append(CommentResponse(**comment))
    
    return result

@api_router.post("/comments/{comment_id}/vote")
async def vote_comment(comment_id: str, vote_req: VoteRequest, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check existing vote
    existing_vote = await db.votes.find_one(
        {"user_id": current_user["id"], "target_id": comment_id, "target_type": "comment"}
    )
    
    upvote_delta = 0
    downvote_delta = 0
    
    if existing_vote:
        old_vote = existing_vote["vote"]
        if old_vote == 1:
            upvote_delta -= 1
        elif old_vote == -1:
            downvote_delta -= 1
        
        if vote_req.vote == 0:
            await db.votes.delete_one({"_id": existing_vote["_id"]})
        else:
            await db.votes.update_one(
                {"_id": existing_vote["_id"]},
                {"$set": {"vote": vote_req.vote}}
            )
    
    if vote_req.vote != 0:
        if not existing_vote:
            await db.votes.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "target_id": comment_id,
                "target_type": "comment",
                "vote": vote_req.vote,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        if vote_req.vote == 1:
            upvote_delta += 1
        elif vote_req.vote == -1:
            downvote_delta += 1
    
    # Update comment vote counts
    await db.comments.update_one(
        {"id": comment_id},
        {"$inc": {"upvotes": upvote_delta, "downvotes": downvote_delta}}
    )
    
    updated_comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    return {
        "upvotes": updated_comment["upvotes"],
        "downvotes": updated_comment["downvotes"],
        "user_vote": vote_req.vote if vote_req.vote != 0 else None
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
