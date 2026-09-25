import { parseLogseqMarkdown } from "./lib/logseq/parser.ts";
import { prepareLogseqPaste } from "./lib/logseq/paste-to-tiptap.ts";
import {
  listItemsFromPaste,
  outlinePasteRange,
} from "./lib/editor/insert-outline-paste.ts";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Node } from "@tiptap/pm/model";
import { Transform } from "@tiptap/pm/transform";
import { LogseqListItem } from "./components/editor/extensions/logseq-list-item.ts";
import { PageReference } from "./components/editor/extensions/page-reference.ts";
import { emptyLogseqDoc } from "./lib/editor/default-doc.ts";

const text = [
  "- ~~None of the above in the Pre-Orthodontic Medical Questionnaire should be top position~~",
  "- ~~View PDF option is missing in Pre-Orthodontic Medical Questionnaire & E-Signature for admin, dentist and hygienist view~~",
  "- ~~PRE-ORTHODONTIC MEDICAL QUESTIONNAIRE need proper formating professional~~",
  "- ~~If there is two parents and while designing the form if we place Parent/Gurdian full name and Parent/Guardian Relationship and if that patient has both the parent's recorded in that form so whom it form goes to sign.~~",
  "- ~~See the below screenshot already signature template is available but when admin try to triger consent it is giving attached error and also signature template not loaded but dentist can able to trigger it but admin should also trigger it.~~",
  "- ~~Dentist send consent form to patient parent and it does sent but parent didn't receive the consent form.~~",
  "\t- [[image_1789698799099_0]]",
  "\t-",
  "\t- [[image_1789698813105_0]]",
  "\t- [[image_1789698836834_0]]",
  "- ~~Allow admin or dentist to update the email incase hygist not provided while submiting referal~~",
  "- ~~Provide dentist side to set treatment plan~~",
  "- ~~Discount is missing on dentist side when patient signature is complete~~",
  "- ~~Once patient sign the consent form then only send patient to temporary credentials.~~",
].join("\n");

const forest = parseLogseqMarkdown(text);
console.log(
  "roots",
  forest.length,
  forest.map((n) =>
    n.type === "bullet" ? `bullet/${n.children.length}` : n.type,
  ),
);
const shot = forest[5];
if (shot?.type === "bullet") {
  console.log(
    "children",
    shot.children.map((c) =>
      c.type === "bullet" ? JSON.stringify(c.inlines) : c.type,
    ),
  );
}

const clip = {
  types: ["text/plain"],
  getData: (t: string) => (t === "text/plain" ? text : ""),
  files: [],
  items: [],
} as unknown as DataTransfer;

const prepared = await prepareLogseqPaste(clip, {
  byName: new Map(),
  ordered: [],
});
console.log(
  "top",
  prepared.content.map((n) => n.type),
);
const items = listItemsFromPaste(prepared.content);
console.log("items", items?.length);

const schema = getSchema([
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: true },
    orderedList: false,
    listItem: false,
  }),
  LogseqListItem,
  PageReference,
  Image.extend({ group: "block" }),
]);
const doc = Node.fromJSON(schema, emptyLogseqDoc);
let cursor = 1;
doc.descendants((node, pos) => {
  if (node.type.name === "paragraph") {
    cursor = pos + 1;
    return false;
  }
  return true;
});
const range = outlinePasteRange(doc, cursor);
const nodes = items!.map((item) => schema.nodeFromJSON(item));
const tr = new Transform(doc);
tr.replaceWith(range!.from, range!.to, nodes);
tr.doc.check();
const dumped = JSON.stringify(tr.doc.toJSON());
console.log(
  "ok",
  dumped.includes("image_1789698799099_0"),
  dumped.includes("temporary credentials"),
  dumped.includes("strike"),
);
