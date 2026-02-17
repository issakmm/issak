import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  MessageCircle, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  GraduationCap,
  MapPin,
  Flame,
  Clock,
  LogOut,
  User,
  MoreVertical,
  RefreshCw
} from "lucide-react";

export default function FeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState("university");
  const [sortType, setSortType] = useState("new");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts?feed_type=${feedType}&sort=${sortType}`);
      setPosts(res.data);
    } catch (err) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [feedType, sortType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (postId, vote) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    const newVote = post.user_vote === vote ? 0 : vote;
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      
      let upvotes = p.upvotes;
      let downvotes = p.downvotes;
      
      // Remove old vote
      if (p.user_vote === 1) upvotes--;
      if (p.user_vote === -1) downvotes--;
      
      // Add new vote
      if (newVote === 1) upvotes++;
      if (newVote === -1) downvotes++;
      
      return { ...p, upvotes, downvotes, user_vote: newVote === 0 ? null : newVote };
    }));

    try {
      await api.post(`/posts/${postId}/vote`, { vote: newVote });
    } catch (err) {
      // Revert on error
      fetchPosts();
      toast.error("Failed to vote");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await api.post("/posts", {
        content: newPostContent.trim(),
        feed_type: feedType
      });
      setPosts([res.data, ...posts]);
      setNewPostContent("");
      setShowCreatePost(false);
      toast.success("Posted anonymously!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">NearbyTalk</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="user-menu-btn">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2" disabled>
                  <User className="w-4 h-4" />
                  <span className="truncate">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" disabled>
                  <Flame className="w-4 h-4 text-[hsl(var(--upvote))]" />
                  <span>{user?.karma || 0} karma</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  data-testid="logout-btn"
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Feed Toggle */}
          <div className="feed-toggle">
            <div 
              className="feed-toggle-indicator"
              style={{
                left: feedType === "university" ? "4px" : "calc(50% + 0px)",
                width: "calc(50% - 4px)",
                backgroundColor: feedType === "university" 
                  ? "hsl(var(--primary))" 
                  : "hsl(var(--secondary))"
              }}
            />
            <button
              data-testid="toggle-university"
              onClick={() => setFeedType("university")}
              className={`feed-toggle-btn flex items-center gap-2 ${feedType === "university" ? "active" : ""}`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.university || "University"}</span>
              <span className="sm:hidden">Uni</span>
            </button>
            <button
              data-testid="toggle-city"
              onClick={() => setFeedType("city")}
              className={`feed-toggle-btn flex items-center gap-2 ${feedType === "city" ? "active" : ""}`}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.city || "City"}</span>
              <span className="sm:hidden">City</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sort Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <button
          data-testid="sort-new"
          onClick={() => setSortType("new")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
            sortType === "new" 
              ? "bg-foreground text-background" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          New
        </button>
        <button
          data-testid="sort-hot"
          onClick={() => setSortType("hot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
            sortType === "hot" 
              ? "bg-foreground text-background" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="w-4 h-4" />
          Hot
        </button>
        <button
          data-testid="refresh-btn"
          onClick={fetchPosts}
          className="ml-auto p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Posts Feed */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share something with your {feedType === "university" ? "campus" : "city"}!
            </p>
            <Button 
              data-testid="first-post-btn"
              onClick={() => setShowCreatePost(true)}
              className="btn-brutal bg-primary text-primary-foreground"
            >
              Create First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onVote={handleVote}
                onClick={() => navigate(`/post/${post.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB - Create Post */}
      <button
        data-testid="create-post-fab"
        onClick={() => setShowCreatePost(true)}
        className="fab bg-primary text-primary-foreground"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation */}
      <nav className="nav-floating">
        <button
          data-testid="nav-feed"
          className="p-3 rounded-full bg-primary text-primary-foreground"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </nav>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-lg border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {feedType === "university" ? (
                <>
                  <GraduationCap className="w-6 h-6 text-primary" />
                  Post to {user?.university}
                </>
              ) : (
                <>
                  <MapPin className="w-6 h-6 text-secondary" />
                  Post to {user?.city}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Share your thoughts anonymously with your {feedType === "university" ? "campus" : "city"} community.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Textarea
                data-testid="post-content-input"
                placeholder="What's on your mind? Share anonymously..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[150px] border-2 text-lg resize-none"
                maxLength={500}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Anonymous post</span>
                <span>{newPostContent.length}/500</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePost(false)}
                className="flex-1 h-12 border-2"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-post-btn"
                type="submit"
                disabled={submitting || !newPostContent.trim()}
                className={`flex-1 h-12 btn-brutal text-white ${
                  feedType === "university" ? "bg-primary" : "bg-secondary"
                }`}
              >
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCard({ post, onVote, onClick }) {
  const score = post.upvotes - post.downvotes;
  
  return (
    <div 
      className="card-sticker cursor-pointer hover:-translate-y-1 transition-all duration-200"
      onClick={onClick}
      data-testid={`post-card-${post.id}`}
    >
      {/* Post Content */}
      <p className="text-lg leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>
      
      {/* Post Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Upvote */}
          <button
            data-testid={`upvote-btn-${post.id}`}
            onClick={(e) => { e.stopPropagation(); onVote(post.id, 1); }}
            className={`vote-btn upvote ${post.user_vote === 1 ? "active" : ""}`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          {/* Score */}
          <span className={`font-bold min-w-[40px] text-center ${
            score > 0 ? "text-[hsl(var(--upvote))]" : 
            score < 0 ? "text-[hsl(var(--downvote))]" : 
            "text-muted-foreground"
          }`}>
            {score}
          </span>
          
          {/* Downvote */}
          <button
            data-testid={`downvote-btn-${post.id}`}
            onClick={(e) => { e.stopPropagation(); onVote(post.id, -1); }}
            className={`vote-btn downvote ${post.user_vote === -1 ? "active" : ""}`}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
        
        {/* Comments & Time */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comment_count}</span>
          </div>
          <span className="text-sm mono">{post.time_ago}</span>
        </div>
      </div>
    </div>
  );
}
