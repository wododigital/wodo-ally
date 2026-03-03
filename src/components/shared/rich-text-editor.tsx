"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils/cn";

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium transition-all duration-100 select-none",
        active
          ? "bg-accent/15 text-accent border border-accent/25"
          : "text-text-secondary hover:text-text-primary hover:bg-black/[0.05] border border-transparent",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-black/[0.08] mx-0.5 shrink-0 self-center" />;
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  variables?: string[];
  minHeight?: number;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  variables = [],
  minHeight = 240,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "outline-none focus:outline-none min-h-[inherit] leading-relaxed text-sm text-text-primary",
      },
    },
  });

  if (!editor) return null;

  function insertVariable(variable: string) {
    editor?.chain().focus().insertContent(variable).run();
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-black/[0.08] bg-white overflow-hidden transition-colors focus-within:border-accent/40",
        className
      )}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-black/[0.06]"
        style={{ background: "rgba(0,0,0,0.015)" }}
      >
        {/* Text formatting */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          &#8226;&#8212;
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          1&#8212;
        </ToolbarBtn>

        <Divider />

        {/* Headings */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Subheading"
        >
          H3
        </ToolbarBtn>

        <Divider />

        {/* Block quote */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          &ldquo;&rdquo;
        </ToolbarBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          ↩
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          ↪
        </ToolbarBtn>

        {/* Variables */}
        {variables.length > 0 && (
          <>
            <Divider />
            <span className="text-[10px] text-text-muted font-medium ml-1 mr-0.5 self-center whitespace-nowrap">
              Insert:
            </span>
            <div className="flex flex-wrap gap-1">
              {variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertVariable(v); }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono border border-blue-500/20 hover:bg-blue-500/20 transition-colors leading-none"
                >
                  {v}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Editor content */}
      <div
        className="px-4 py-3 cursor-text"
        style={{ minHeight }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
