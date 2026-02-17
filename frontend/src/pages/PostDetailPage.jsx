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
      toast.success("Comment added");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const postScore = post.upvotes - post.downvotes;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            data-testid="back-btn"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/feed")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-medium">Post</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4">
        {/* Post */}
        <div className="card-minimal mb-6 animate-fade-in" data-testid="post-detail">
          <p className="text-foreground text-lg leading-relaxed mb-6 whitespace-pre-wrap">
            {post.content}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-1">
              <button
                data-testid="post-upvote-btn"
                onClick={() => handleVotePost(1)}
                className={`vote-btn ${post.user_vote === 1 ? "upvote active" : ""}`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              
              <span className={`text-sm font-medium min-w-[40px] text-center ${
                postScore > 0 ? "text-primary" : "text-muted-foreground"
              }`}>
                {postScore}
              </span>
              
              <button
                data-testid="post-downvote-btn"
                onClick={() => handleVotePost(-1)}
                className={`vote-btn ${post.user_vote === -1 ? "downvote active" : ""}`}
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comment_count}</span>
              </div>
              <span>{post.time_ago}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No comments yet
            </div>
          ) : (
            <div className="space-y-2 stagger-children">
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

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <form onSubmit={handleSubmitComment} className="max-w-xl mx-auto flex gap-2">
          <Textarea
            data-testid="comment-input"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 min-h-[44px] max-h-[100px] bg-muted border-border text-foreground resize-none py-3"
            maxLength={300}
            rows={1}
          />
          <Button
            data-testid="submit-comment-btn"
            type="submit"
            disabled={submitting || !newComment.trim()}
            size="icon"
            className="bg-primary text-primary-foreground h-[44px] w-[44px]"
          >
            <Send className="w-4 h-4" />
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
      className="bg-muted/50 rounded-lg p-4 border border-border/50"
      data-testid={`comment-card-${comment.id}`}
    >
      <p className="text-foreground mb-3 whitespace-pre-wrap text-sm">{comment.content}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            data-testid={`comment-upvote-btn-${comment.id}`}
            onClick={() => onVote(comment.id, 1)}
            className={`vote-btn p-1 ${comment.user_vote === 1 ? "upvote active" : ""}`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          
          <span className={`text-xs font-medium min-w-[24px] text-center ${
            score > 0 ? "text-primary" : "text-muted-foreground"
          }`}>
            {score}
          </span>
          
          <button
            data-testid={`comment-downvote-btn-${comment.id}`}
            onClick={() => onVote(comment.id, -1)}
            className={`vote-btn p-1 ${comment.user_vote === -1 ? "downvote active" : ""}`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <span className="text-xs text-muted-foreground">{comment.time_ago}</span>
      </div>
    </div>
  );
}
