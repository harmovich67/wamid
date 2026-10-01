import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const TYPES = new Set(["paragraph", "heading", "listItem", "bulletList", "orderedList", "blockquote"]);
const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR = /[A-Za-zÀ-ɏ]/;

// Direction of the first strong character (like dir="auto", but it also works for lists,
// whose own dir="auto" can't see text inside children that carry their own dir).
function detect(text) {
  for (const ch of text) {
    if (RTL.test(ch)) return "rtl";
    if (LTR.test(ch)) return "ltr";
  }
  return null;
}

function build(doc) {
  const decos = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock") return false;
    if (TYPES.has(node.type.name)) {
      const dir = detect(node.textContent);
      if (dir) decos.push(Decoration.node(pos, pos + node.nodeSize, { dir }));
    }
    return true;
  });
  return DecorationSet.create(doc, decos);
}

/** Gives every paragraph, heading, list and quote the direction of its own text. */
export const AutoDir = Extension.create({
  name: "autoDir",
  addProseMirrorPlugins() {
    const key = new PluginKey("autoDir");
    return [
      new Plugin({
        key,
        state: {
          init: (_, { doc }) => build(doc),
          apply: (tr, old) => (tr.docChanged ? build(tr.doc) : old),
        },
        props: {
          decorations: (state) => key.getState(state),
        },
      }),
    ];
  },
});
