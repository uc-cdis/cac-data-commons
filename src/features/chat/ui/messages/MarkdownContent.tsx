"use client";

import { memo, useMemo } from "react";
import ReactMarkdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Typography } from "@mantine/core";
import { normalizeMath } from "./normalizeMath";

const components: Components = {
  table: ({ children }) => (
    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
      <table>{children}</table>
    </div>
  ),
};
const remarkPlugins: Options["remarkPlugins"] = [remarkGfm, remarkMath];
const rehypePlugins: Options["rehypePlugins"] = [
  [rehypeKatex, { output: "mathml" }],
];

export const MarkdownContent = memo(function MarkdownContent({
  content,
}: {
  content: string;
}) {
  const source = useMemo(() => normalizeMath(content), [content]);

  return (
    <Typography fz="sm" className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </Typography>
  );
});
