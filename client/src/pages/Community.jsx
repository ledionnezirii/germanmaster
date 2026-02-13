'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Trash2, Clock, Users, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';
import { SOCKET_URL } from '../services/api';
import { communityService } from '../services/api';
import logo from "../../public/logo.png"

/* ── palette (light cream theme, all inline) ─────────────────────── */
const C = {
  bg:        '#f8f7f4',
  surface:   '#ffffff',
  surfaceHi: '#f1f0ec',
  border:    '#e4e2dc',
  borderHi:  '#d1cfc8',
  text:      '#1a1a1a',
  textSec:   '#4a4a4a',
  textMut:   '#8a8780',
  accent:    '#2563eb',
  accentHi:  '#1d4ed8',
  red:       '#dc2626',
  redBg:     'rgba(220,38,38,0.08)',
  accentBg:  'rgba(37,99,235,0.08)',
  heartPink: '#e11d48',
  heartBg:   'rgba(225,29,72,0.08)',
  shadow:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
};

export default function Community() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replies, setReplies] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMessages();
    initSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initSocket = () => {
    socketRef.current = io(`${SOCKET_URL}/community`, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Lidhur me komunitetin');
      socketRef.current.emit('joinCommunity');
    });

    socketRef.current.on('messagePosted', (data) => {
      if (!data.parentId) {
        setMessages(prev => [data, ...prev]);
      } else {
        setReplies(prev => ({
          ...prev,
          [data.parentId]: [...(prev[data.parentId] || []), data]
        }));
      }
    });

    socketRef.current.on('likeUpdate', (data) => {
      updateMessageLikes(data.messageId, data.likes, data.isLiked);
    });

    socketRef.current.on('messageRemoved', (data) => {
      setMessages(prev => prev.filter(m => m._id !== data.messageId));
      if (data.parentId) {
        setReplies(prev => ({
          ...prev,
          [data.parentId]: prev[data.parentId]?.filter(r => r._id !== data.messageId) || []
        }));
      }
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await communityService.getMessages();
      setMessages(res.data || res);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (messageId) => {
    try {
      const res = await communityService.getReplies(messageId);
      setReplies(prev => ({ ...prev, [messageId]: res.data || res }));
    } catch (error) {
      console.error('Fetch replies error:', error);
    }
  };

  const postMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const mentions = extractMentions(newMessage);
      const res = await communityService.postMessage(newMessage, replyingTo, mentions);
      const messageData = res.data || res;

      if (!replyingTo) {
        setMessages(prev => [messageData, ...prev]);
      } else {
        setReplies(prev => ({
          ...prev,
          [replyingTo]: [...(prev[replyingTo] || []), messageData]
        }));
      }

      socketRef.current?.emit('newMessage', messageData);
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Post message error:', error);
    }
  };

  const toggleLike = async (messageId) => {
    try {
      const res = await communityService.toggleLike(messageId);
      const { likes, isLiked } = res.data || res;
      updateMessageLikes(messageId, likes, isLiked);
      socketRef.current?.emit('messageLiked', { messageId, likes, isLiked });
    } catch (error) {
      console.error('Toggle like error:', error);
    }
  };

  const deleteMessage = async (messageId, parentId) => {
    try {
      await communityService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      if (parentId) {
        setReplies(prev => ({
          ...prev,
          [parentId]: prev[parentId]?.filter(r => r._id !== messageId) || []
        }));
      }
      socketRef.current?.emit('messageDeleted', { messageId, parentId });
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const updateMessageLikes = (messageId, likesCount, isLiked) => {
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        let newLikes = [...(m.likes || [])];
        if (isLiked) {
          if (!newLikes.includes(user._id)) newLikes.push(user._id);
        } else {
          newLikes = newLikes.filter(id => id !== user._id);
        }
        return { ...m, likes: newLikes };
      }
      return m;
    }));

    Object.keys(replies).forEach(parentId => {
      setReplies(prev => ({
        ...prev,
        [parentId]: prev[parentId]?.map(r => {
          if (r._id === messageId) {
            let newLikes = [...(r.likes || [])];
            if (isLiked) {
              if (!newLikes.includes(user._id)) newLikes.push(user._id);
            } else {
              newLikes = newLikes.filter(id => id !== user._id);
            }
            return { ...r, likes: newLikes };
          }
          return r;
        })
      }));
    });
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const toggleReplies = (messageId) => {
    if (expandedMessages[messageId]) {
      setExpandedMessages(prev => ({ ...prev, [messageId]: false }));
    } else {
      setExpandedMessages(prev => ({ ...prev, [messageId]: true }));
      if (!replies[messageId]) {
        fetchReplies(messageId);
      }
    }
  };

  
  const renderContent = (text) => {
  const parts = text.split(/(@\w+)/g);

  return parts.map((part, i) =>
    /^@\w+/.test(part) ? (
      <span
        key={i}
        style={{
          color: '#ca8a04',
          fontWeight: 600,
          background: 'rgba(202,138,4,0.1)',
          borderRadius: 4,
          padding: '1px 4px',
        }}
      >
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
};

  const renderMessage = (message, isReply = false) => {
    const isOwner = message.userId?._id === user._id;
    const isLiked = message.likes?.some(l => l === user._id);
    const avatarUrl = message.userId?.avatarStyle
      ? `https://api.dicebear.com/9.x/${message.userId.avatarStyle}/svg?seed=${message.userId._id}`
      : '/placeholder.svg?height=40&width=40';
    const replyCount = message.replyCount || 0;
    const likeCount = message.likes?.length || 0;
    const isExpanded = expandedMessages[message._id];

    return (
   <motion.div
  key={message._id}
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
  style={{
    marginBottom: isReply ? 0 : 0,
    // ✅ Removed the breakInside line
  }}
>
      
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: isReply ? '12px 14px' : '18px 20px',
            marginLeft: isReply ? 32 : 0,
            marginTop: isReply ? 8 : 0,
            boxShadow: C.shadow,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.borderHi;
            e.currentTarget.style.boxShadow = C.shadowHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = C.shadow;
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* Avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                overflow: 'hidden',
                background: C.surfaceHi,
                border: `2px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <img
                src={avatarUrl || "/placeholder.svg"}
                alt={`Avatari i ${message.username}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name & timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: C.text,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {message.username}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: C.textMut,
                  }}
                >
                  <Clock style={{ width: 12, height: 12 }} />
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Message body */}
              <p
                style={{
                  color: C.textSec,
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                  
                  marginBottom: 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {renderContent(message.content)}
              </p>

              {/* Action bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {/* Like button */}
                <button
                  onClick={() => toggleLike(message._id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: isLiked ? C.heartBg : 'transparent',
                    color: isLiked ? C.heartPink : C.textMut,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLiked) e.currentTarget.style.background = C.surfaceHi;
                  }}
                  onMouseLeave={(e) => {
                    if (!isLiked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Heart
                    style={{
                      width: 15,
                      height: 15,
                      fill: isLiked ? C.heartPink : 'none',
                      transition: 'all 0.15s',
                    }}
                  />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>

                {/* Reply count / toggle */}
                {!isReply && (
                  <button
                    onClick={() => toggleReplies(message._id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: isExpanded ? C.accentBg : 'transparent',
                      color: isExpanded ? C.accent : C.textMut,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = C.surfaceHi;
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <MessageCircle style={{ width: 15, height: 15 }} />
                    {replyCount > 0 && <span>{replyCount}</span>}
                    {isExpanded
                      ? <ChevronUp style={{ width: 13, height: 13 }} />
                      : <ChevronDown style={{ width: 13, height: 13 }} />
                    }
                  </button>
                )}

                {/* Quick reply */}
                <button
                  onClick={() => {
                    setReplyingTo(message._id);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: C.textMut,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.surfaceHi;
                    e.currentTarget.style.color = C.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = C.textMut;
                  }}
                >
                  Pergjigju
                </button>

                {/* Delete */}
                {isOwner && (
                  <button
                    onClick={() => deleteMessage(message._id, message.parentId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: C.textMut,
                      cursor: 'pointer',
                      marginLeft: 'auto',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.redBg;
                      e.currentTarget.style.color = C.red;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = C.textMut;
                    }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Replies thread */}
        {!isReply && isExpanded && replies[message._id] && (
          <AnimatePresence>
            {replies[message._id].map(reply => renderMessage(reply, true))}
          </AnimatePresence>
        )}
      </motion.div>
    );
  };

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${C.borderHi}`,
            borderTopColor: C.accent,
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: C.textMut, fontSize: 14 }}>Duke ngarkuar komunitetin...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        .community-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .community-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .community-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.bg,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: C.accentBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
              src={logo || "/placeholder.svg"} width={55}
              className='rounded-4xl'
              />
              {/* <Users style={{ width: 18, height: 18, color: C.accent }} /> */}
            </div>
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Komuniteti
              </h1>
              <p style={{ fontSize: 13, color: C.textMut, margin: 0, marginTop: 1 }}>
                {messages.length} {messages.length === 1 ? 'postim' : 'postime'}
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.2)',
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 6px rgba(22,163,74,0.4)',
              }}
            />
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Drejtperdrejt</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 120px 24px' }}>
        {/* 24-hour auto-delete notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.2)',
            marginBottom: 20,
          }}
        >
          <Clock style={{ width: 16, height: 16, color: '#b45309', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            Postimet fshihen automatikisht pas 24 oreve. Shijoni bisedat sa jane aktive!
          </p>
        </div>

        {/* Compose box */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 28,
            boxShadow: C.shadow,
          }}
        >
          {/* Replying indicator */}
          {replyingTo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: C.accentBg,
                border: `1px solid rgba(59,130,246,0.2)`,
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>
                Duke iu pergjigjur mesazhit...
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(59,130,246,0.15)',
                  color: C.accent,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            {/* User avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                overflow: 'hidden',
                background: C.surfaceHi,
                border: `2px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              {user.avatarStyle ? (
                <img
                  src={`https://api.dicebear.com/9.x/${user.avatarStyle}/svg?seed=${user._id}`}
                  alt="Avatari juaj"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.textMut,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {user.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ndani dicka me komunitetin..."
              rows={2}
              style={{
                flex: 1,
                background: C.surfaceHi,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: C.text,
                caretColor: C.accent,
                fontSize: 14,
                lineHeight: 1.5,
                resize: 'vertical',
                minHeight: 44,
                maxHeight: 200,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  postMessage();
                }
              }}
            />

            <button
              onClick={postMessage}
              disabled={!newMessage.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: newMessage.trim() ? C.accent : C.surfaceHi,
                color: newMessage.trim() ? '#fff' : C.textMut,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: newMessage.trim() ? 'pointer' : 'default',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (newMessage.trim()) e.currentTarget.style.background = C.accentHi;
              }}
              onMouseLeave={(e) => {
                if (newMessage.trim()) e.currentTarget.style.background = C.accent;
              }}
            >
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <p style={{ fontSize: 12, color: C.textMut, margin: 0, marginTop: 10, paddingLeft: 48 }}>
            {'Shtypni Enter per te derguar \u00B7 Shift+Enter per rresht te ri \u00B7 @perdorues per te permendur'}
          </p>
        </div>

        {/* Messages Feed - responsive grid */}
        <div className="community-grid">
          <AnimatePresence>
            {messages.map(message => renderMessage(message))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 80,
              paddingBottom: 80,
              gridColumn: '1 / -1',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: C.surface,
                border: `1px solid ${C.border}`,
                boxShadow: C.shadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Sparkles style={{ width: 32, height: 32, color: C.textMut }} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: C.text,
                margin: 0,
                marginBottom: 8,
              }}
            >
              Ende nuk ka biseda
            </h3>
            <p style={{ fontSize: 14, color: C.textMut, margin: 0, textAlign: 'center', maxWidth: 320 }}>
              Beni te parin qe fillon nje bisede. Ndani mendimet tuaja, beni nje pyetje, ose thoni pershendetje.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
