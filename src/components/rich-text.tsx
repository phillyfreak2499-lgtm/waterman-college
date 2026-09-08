import { Fragment } from "react";
import { parseMarkdown, type BlockNode, type InlineNode } from "@/lib/markdown";

/**
 * Render the safe Markdown node tree (from `@/lib/markdown`) as React elements.
 * Only known element types are emitted and all text is React-escaped, so there
 * is no HTML-injection surface. Links open in a new tab with noopener.
 */
export function RichText({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <Block key={i} node={block} />
      ))}
    </div>
  );
}

function Block({ node }: { node: BlockNode }) {
  switch (node.t) {
    case "h": {
      const cls =
        node.level === 1
          ? "font-display text-3xl leading-tight"
          : node.level === 2
            ? "font-display text-2xl leading-tight"
            : "font-display text-xl leading-tight";
      if (node.level === 1) return <h2 className={cls}><Inline nodes={node.c} /></h2>;
      if (node.level === 2) return <h3 className={cls}><Inline nodes={node.c} /></h3>;
      return <h4 className={cls}><Inline nodes={node.c} /></h4>;
    }
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-6">
          {node.items.map((item, i) => (
            <li key={i}><Inline nodes={item} /></li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-1.5 pl-6">
          {node.items.map((item, i) => (
            <li key={i}><Inline nodes={item} /></li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-brass bg-paper-2 px-4 py-2 italic">
          <Inline nodes={node.c} />
        </blockquote>
      );
    case "img":
      return (
        <img
          src={node.src}
          alt={node.alt}
          className="mx-auto max-h-[28rem] w-auto rounded-md border border-line"
          loading="lazy"
        />
      );
    case "p":
    default:
      return <p><Inline nodes={node.c} /></p>;
  }
}

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => (
        <InlineNodeView key={i} node={node} />
      ))}
    </>
  );
}

function InlineNodeView({ node }: { node: InlineNode }) {
  switch (node.t) {
    case "text":
      return <Fragment>{node.v}</Fragment>;
    case "strong":
      return <strong className="font-semibold"><Inline nodes={node.c} /></strong>;
    case "em":
      return <em><Inline nodes={node.c} /></em>;
    case "code":
      return <code className="rounded-sm bg-paper-2 px-1.5 py-0.5 text-[0.9em]">{node.v}</code>;
    case "br":
      return <br />;
    case "img":
      return <img src={node.src} alt={node.alt} className="inline-block max-h-40 w-auto align-middle" loading="lazy" />;
    case "link":
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-brass/40 underline-offset-4 transition-colors hover:decoration-navy"
        >
          <Inline nodes={node.c} />
        </a>
      );
    default:
      return null;
  }
}
