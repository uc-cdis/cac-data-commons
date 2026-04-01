import React from 'react';
import { ReasoningUIPart } from 'ai';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from './Reasoning';

export const ReasoningView = ({ part }: { part: ReasoningUIPart }) => {
  return (
    <Reasoning className="w-full" isStreaming={part.state === 'streaming'}>
      <ReasoningTrigger />
      <ReasoningContent>{part.text}</ReasoningContent>
    </Reasoning>
  );
};
