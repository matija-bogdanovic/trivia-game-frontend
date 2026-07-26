import Image from 'next/image';
import React from 'react';

interface PlayerProps {
  id: string;
  name: string;
  isCurrentUser: boolean;
  points?: number;
}

export function Player({ id, name, isCurrentUser, points = 0 }: PlayerProps) {
  return (
    <div
      key={id}
      className="flex transition duration-75 flex-col items-center gap-2 border border-black p-2 rounded"
    >
      <Image alt={'pfp'} width={50} height={50} src="/pfp.svg" />
      <div className="flex flex-col items-center">
        {isCurrentUser && (
          <span className="text-sm text-gray-500">&#40;you&#41;</span>
        )}
        <h4>{name}</h4>
        <div className="flex items-center gap-1">
          <Image width={20} height={20} src="/token.svg" alt="token" />
          <span>{points}</span>
        </div>
      </div>
    </div>
  );
}
