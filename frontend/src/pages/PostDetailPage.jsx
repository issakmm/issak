import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { 
  ArrowLeft,
  ArrowUp, 
  ArrowDown, 
  MessageCircle,
  Send
} from "lucide-react";

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/comments`)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      toast.error("Failed to load post");
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleVotePost = async (vote) => {
    if (!post) return;

    const newVote = post.user_vote === vote ? 0 : vote;
    
    // Optimistic update
    setPost(prev => {
      let upvotes = prev.upvotes;
      let downvotes = prev.downvotes;
      
      if (prev.user_vote === 1) upvotes--;
      if (prev.user_vote === -1) downvotes--;
      if (newVote === 1) upvotes++;
      if (newVote === -1) downvotes++;
      
      return { ...prev, upvotes, downvotes, user_vote: newVote === 0 ? null : newVote };
    });

    try {
      await api.post(`/posts/${postId}/vote`, { vote: newVote });
    } catch (err) {
      fetchPost();
      toast.error("Failed to vote");
    }
  };

  const handleVoteComment = async (commentId, vote) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const newVote = comment.user_vote === vote ? 0 : vote;
    
    // Optimistic update
    setComments(comments.map(c => {
      if (c.id !== commentId) return c;
      
      let upvotes = c.upvotes;
      let downvotes = c.downvotes;
      
      if (c.user_vote === 1) upvotes--;
      if (c.user_vote === -1) downvotes--;
      if (newVote === 1) upvotes++;
      if (newVote === -1) downvotes++;
      
      return { ...c, upvotes, downvotes, user_vote: newVote === 0 ? null : newVote };
    }));

    try {
      await api.post(`/comments/${commentId}/vote`, { vote: newVote });
    } catch (err) {
      fetchPost();
      toast.error("Failed to vote");
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, {
        content: newComment.trim()
      });
      setComments([...comments, res.data]);
      setPost(prev => ({ ...prev, comment_count: prev.comment_count + 1 }));
      setNewComment("");
      toast.success("Comment added!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const postScore = post.upvotes - post.downvotes;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            data-testid="back-btn"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/feed")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Post */}
        <div className="card-sticker mb-8 animate-slide-up" data-testid="post-detail">
          <p className="text-xl leading-relaxed mb-6 whitespace-pre-wrap">
            {post.content}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-1">
              <button
                data-testid="post-upvote-btn"
                onClick={() => handleVotePost(1)}
                className={`vote-btn upvote ${post.user_vote === 1 ? "active" : ""}`}
              >
                <ArrowUp className="w-6 h-6" />
              </button>
              
              <span className={`font-bold text-xl min-w-[50px] text-center ${
                postScore > 0 ? "text-[hsl(var(--upvote))]" : 
                postScore < 0 ? "text-[hsl(var(--downvote))]" : 
                "text-muted-foreground"
              }`}>
                {postScore}
              </span>
              
              <button
                data-testid="post-downvote-btn"
                onClick={() => handleVotePost(-1)}
                className={`vote-btn downvote ${post.user_vote === -1 ? "active" : ""}`}
              >
                <ArrowDown className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comment_count} comments</span>
              </div>
              <span className="mono">{post.time_ago}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No comments yet. Be the first to reply!</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {comments.map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment}
                  onVote={handleVoteComment}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Comment Input - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4">
        <form onSubmit={handleSubmitComment} className="max-w-2xl mx-auto flex gap-3">
          <Textarea
            data-testid="comment-input"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 min-h-[50px] max-h-[100px] border-2 resize-none"
            maxLength={300}
            rows={1}
          />
          <Button
            data-testid="submit-comment-btn"
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="btn-brutal bg-primary text-primary-foreground px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function CommentCard({ comment, onVote }) {
  const score = comment.upvotes - comment.downvotes;
  
  return (
    <div 
      className="bg-muted rounded-xl p-4 border border-border/50"
      data-testid={`comment-card-${comment.id}`}
    >
      <p className="mb-3 whitespace-pre-wrap">{comment.content}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            data-testid={`comment-upvote-btn-${comment.id}`}
            onClick={() => onVote(comment.id, 1)}
            className={`vote-btn upvote p-1.5 ${comment.user_vote === 1 ? "active" : ""}`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          
          <span className={`font-bold text-sm min-w-[30px] text-center ${
            score > 0 ? "text-[hsl(var(--upvote))]" : 
            score < 0 ? "text-[hsl(var(--downvote))]" : 
            "text-muted-foreground"
          }`}>
            {score}
          </span>
          
          <button
            data-testid={`comment-downvote-btn-${comment.id}`}
            onClick={() => onVote(comment.id, -1)}
            className={`vote-btn downvote p-1.5 ${comment.user_vote === -1 ? "active" : ""}`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
        
        <span className="text-xs text-muted-foreground mono">{comment.time_ago}</span>
      </div>
    </div>
  );
}
