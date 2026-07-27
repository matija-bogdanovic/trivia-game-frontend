'use client';

import { Agentation } from 'agentation';

/** dev-only annotation toolbar for giving visual feedback to coding agents */
export default function AgentationToolbar() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <Agentation />;
}
