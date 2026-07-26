'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';

function ChatUI() {
  const { t } = useT();
  const { sendChat, username } = useGame();
  const messages = useSelector((state: RootState) => state.game.chatMessages);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  // keep the newest message in view
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChat(text);
    setText('');
  };

  return (
    <div className="flex flex-col border p-3 gap-2 h-64">
      <h4 className="font-semibold">{t('chat.title')}</h4>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto flex flex-col gap-1 text-sm pr-1"
      >
        {messages.length === 0 && (
          <p className="text-gray-400">{t('chat.empty')}</p>
        )}
        {messages.map((m, i) =>
          m.username === null ? (
            <p key={`${m.at}-${i}`} className="text-gray-400 italic">
              {m.text}
            </p>
          ) : (
            <p key={`${m.at}-${i}`} className="break-words">
              <strong
                className={
                  m.username === username ? 'text-blue-600' : 'text-gray-800'
                }
              >
                {m.username}
              </strong>
              : {m.text}
            </p>
          )
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          maxLength={300}
          className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('chat.send')}
        </button>
      </form>
    </div>
  );
}

export default ChatUI;
