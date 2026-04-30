import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Play, Pause, Image, Music, Send, Trash2, Loader2 } from 'lucide-react'
import { api, Post, CreatePostPayload } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

export default function FeedPage() {
  const [posts,       setPosts]       = useState<Post[]>([])
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [posting,     setPosting]     = useState(false)
  const [form,        setForm]        = useState<CreatePostPayload>({ content: '' })
  const { user }                      = useAuthStore()
  const { playTrack, isPlaying, queue } = usePlayerStore()

  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true)
    const res = await api.posts.list(p)
    setPosts((prev) => p === 1 ? res.items : [...prev, ...res.items])
    setTotal(res.total)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts(1) }, [fetchPosts])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setPosting(true)
    const newPost = await api.posts.create(form)
    setPosts((p) => [newPost, ...p])
    setForm({ content: '' })
    setPosting(false)
  }

  const handleLike = async (postId: string) => {
    if (!user) return
    const res = await api.posts.like(postId)
    setPosts((p) => p.map((post) =>
      post.id === postId
        ? { ...post, liked: res.liked, likes_count: res.likes_count }
        : post,
    ))
  }

  const handleDelete = async (postId: string) => {
    await api.posts.delete(postId)
    setPosts((p) => p.filter((post) => post.id !== postId))
  }

  return (
    <div className="min-h-screen pt-24 pb-32 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-2">
            Comunidad
          </p>
          <h1 className="font-display text-4xl text-white">El Muro</h1>
          <p className="text-white/40 mt-2">Comparte tu arte con la comunidad Lao-tse.</p>
        </div>

        {/* Compose */}
        {user && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handlePost}
            className="card-studio p-5 mb-8"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex-shrink-0 flex items-center justify-center">
                <span className="text-gold font-bold text-sm">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="¿Qué hay de nuevo en el estudio?"
                  rows={3}
                  className="input-studio resize-none"
                />

                {/* Optional fields */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    placeholder="URL de imagen"
                    value={form.image_url ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value || undefined }))}
                    className="input-studio text-xs py-2"
                  />
                  <input
                    type="url"
                    placeholder="URL de audio"
                    value={form.audio_url ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, audio_url: e.target.value || undefined }))}
                    className="input-studio text-xs py-2"
                  />
                </div>
                {form.audio_url && (
                  <input
                    type="text"
                    placeholder="Título del audio"
                    value={form.audio_title ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, audio_title: e.target.value || undefined }))}
                    className="input-studio text-xs py-2"
                  />
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={posting || !form.content.trim()}
                    className="btn-gold py-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        )}

        {/* Posts */}
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onLike={() => handleLike(post.id)}
                onDelete={() => handleDelete(post.id)}
                isCurrentlyPlaying={
                  isPlaying && queue[0]?.id === post.id
                }
                onPlayAudio={() => {
                  if (post.audio_url) {
                    const fakeTrack = {
                      id: post.id,
                      title: post.audio_title ?? post.author?.username ?? 'Post audio',
                      artist_id: post.user_id,
                      artist: post.author,
                      file_url: post.audio_url,
                      play_count: 0,
                      created_at: post.created_at,
                    }
                    playTrack(fakeTrack as any)
                  }
                }}
              />
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gold/50" />
            </div>
          )}

          {!loading && posts.length < total && (
            <button
              onClick={() => { setPage((p) => p + 1); fetchPosts(page + 1) }}
              className="btn-outline-gold w-full justify-center"
            >
              Cargar más
            </button>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-20 text-white/30">
              <Music size={40} className="mx-auto mb-4 opacity-30" />
              <p>Aún no hay publicaciones. ¡Sé el primero!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface PostCardProps {
  post: Post
  currentUser: ReturnType<typeof useAuthStore>['user']
  onLike: () => void
  onDelete: () => void
  onPlayAudio: () => void
  isCurrentlyPlaying: boolean
}

function PostCard({ post, currentUser, onLike, onDelete, onPlayAudio, isCurrentlyPlaying }: PostCardProps) {
  const canDelete =
    currentUser?.id === post.user_id || currentUser?.role === 'admin'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{   opacity: 0, scale: 0.95 }}
      className="card-studio p-5 hover:border-studio-muted transition-colors"
    >
      {/* Author */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {post.author?.avatar_url
              ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-gold font-bold">{post.author?.username[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">{post.author?.username}</span>
              {post.author?.role !== 'client' && (
                <span className="text-[10px] uppercase tracking-widest text-gold/70
                                 bg-gold/10 px-1.5 py-0.5 rounded-full">
                  {post.author?.role}
                </span>
              )}
            </div>
            <span className="text-white/30 text-xs">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-white/80 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Image */}
      {post.image_url && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img
            src={post.image_url}
            alt=""
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      {/* Audio player */}
      {post.audio_url && (
        <button
          onClick={onPlayAudio}
          className={clsx(
            'w-full flex items-center gap-4 p-4 rounded-xl mb-4 border transition-all',
            isCurrentlyPlaying
              ? 'bg-gold/10 border-gold/40'
              : 'bg-studio-muted border-studio-border hover:border-gold/30',
          )}
        >
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            isCurrentlyPlaying ? 'bg-gold' : 'bg-studio-card',
          )}>
            {isCurrentlyPlaying
              ? <Pause size={16} className="text-black" />
              : <Play  size={16} className={clsx('translate-x-0.5', isCurrentlyPlaying ? 'text-black' : 'text-gold')} />
            }
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              {post.audio_title ?? 'Reproducir audio'}
            </p>
            <p className="text-xs text-white/40">Toca para escuchar</p>
          </div>

          {isCurrentlyPlaying && (
            <div className="ml-auto flex items-end gap-0.5 h-5">
              {[1, 2, 3, 4, 3].map((h, i) => (
                <div key={i} className="waveform-bar" style={{
                  height: `${h * 4}px`,
                  animationDelay: `${i * 0.12}s`,
                }} />
              ))}
            </div>
          )}
        </button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t border-studio-border">
        <button
          onClick={onLike}
          disabled={!currentUser}
          className={clsx(
            'flex items-center gap-1.5 text-sm transition-all',
            post.liked
              ? 'text-gold'
              : 'text-white/40 hover:text-gold disabled:cursor-not-allowed',
          )}
        >
          <Heart
            size={16}
            className={clsx('transition-all', post.liked && 'fill-gold')}
          />
          {post.likes_count > 0 && <span>{post.likes_count}</span>}
        </button>
      </div>
    </motion.article>
  )
}
