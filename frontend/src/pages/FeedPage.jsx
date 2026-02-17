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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  MessageCircle, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  GraduationCap,
  MapPin,
  Clock,
  LogOut,
  User,
  MoreVertical,
  RefreshCw,
  TrendingUp
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

    const newVote = post.user_vote === vote ? 0 : vote;
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      
      let upvotes = p.upvotes;
      let downvotes = p.downvotes;
      
      if (p.user_vote === 1) upvotes--;
      if (p.user_vote === -1) downvotes--;
      if (newVote === 1) upvotes++;
      if (newVote === -1) downvotes++;
      
      return { ...p, upvotes, downvotes, user_vote: newVote === 0 ? null : newVote };
    }));

    try {
      await api.post(`/posts/${postId}/vote`, { vote: newVote });
    } catch (err) {
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
      toast.success("Posted anonymously");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg font-semibold">NearbyTalk</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="user-menu-btn" className="text-muted-foreground">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                <DropdownMenuItem className="gap-2 text-muted-foreground" disabled>
                  <User className="w-4 h-4" />
                  <span className="truncate text-sm">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
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
                left: feedType === "university" ? "4px" : "calc(50%)",
                width: "calc(50% - 4px)",
              }}
            />
            <button
              data-testid="toggle-university"
              onClick={() => setFeedType("university")}
              className={`feed-toggle-btn flex items-center justify-center gap-2 ${feedType === "university" ? "active" : "text-muted-foreground"}`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="truncate">{user?.university || "University"}</span>
            </button>
            <button
              data-testid="toggle-city"
              onClick={() => setFeedType("city")}
              className={`feed-toggle-btn flex items-center justify-center gap-2 ${feedType === "city" ? "active" : "text-muted-foreground"}`}
            >
              <MapPin className="w-4 h-4" />
              <span className="truncate">{user?.city || "City"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sort Tabs */}
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-2 border-b border-border/50">
        <button
          data-testid="sort-new"
          onClick={() => setSortType("new")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            sortType === "new" 
              ? "bg-muted text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          New
        </button>
        <button
          data-testid="sort-hot"
          onClick={() => setSortType("hot")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            sortType === "hot" 
              ? "bg-muted text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Top
        </button>
        <button
          data-testid="refresh-btn"
          onClick={fetchPosts}
          className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Posts Feed */}
      <main className="max-w-xl mx-auto px-4 py-4">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to share something
            </p>
            <Button 
              data-testid="first-post-btn"
              onClick={() => setShowCreatePost(true)}
              className="bg-primary text-primary-foreground"
            >
              Create Post
            </Button>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
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
        <Plus className="w-5 h-5" />
      </button>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              {feedType === "university" ? (
                <>
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Post to {user?.university}
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 text-primary" />
                  Post to {user?.city}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your post will be anonymous
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Textarea
                data-testid="post-content-input"
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[120px] bg-muted border-border text-foreground resize-none"
                maxLength={500}
              />
              <div className="flex justify-end text-xs text-muted-foreground">
                <span>{newPostContent.length}/500</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePost(false)}
                className="flex-1 border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-post-btn"
                type="submit"
                disabled={submitting || !newPostContent.trim()}
                className="flex-1 bg-primary text-primary-foreground"
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
      className="card-minimal cursor-pointer"
      onClick={onClick}
      data-testid={`post-card-${post.id}`}
    >
      <p className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            data-testid={`upvote-btn-${post.id}`}
            onClick={(e) => { e.stopPropagation(); onVote(post.id, 1); }}
            className={`vote-btn ${post.user_vote === 1 ? "upvote active" : ""}`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          
          <span className={`text-sm font-medium min-w-[32px] text-center ${
            score > 0 ? "text-primary" : 
            score < 0 ? "text-muted-foreground" : 
            "text-muted-foreground"
          }`}>
            {score}
          </span>
          
          <button
            data-testid={`downvote-btn-${post.id}`}
            onClick={(e) => { e.stopPropagation(); onVote(post.id, -1); }}
            className={`vote-btn ${post.user_vote === -1 ? "downvote active" : ""}`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-xs">{post.comment_count}</span>
          </div>
          <span className="text-xs">{post.time_ago}</span>
        </div>
      </div>
    </div>
  );
}
