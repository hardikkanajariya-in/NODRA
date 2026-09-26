import { prepareLogseqPaste } from "./lib/logseq/paste-to-tiptap.ts";
import { listItemsFromPaste, outlinePasteRange } from "./lib/editor/insert-outline-paste.ts";
import { emptyLogseqDoc } from "./lib/editor/default-doc.ts";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Node } from "@tiptap/pm/model";
import { Transform } from "@tiptap/pm/transform";
import { LogseqListItem } from "./components/editor/extensions/logseq-list-item.ts";
import { PageReference } from "./components/editor/extensions/page-reference.ts";

const text = `- Before doing a signature show a dialogue confirmation that your signature is being captured on multiple places do you want to sign each or just one place and rest applied automatically
- make the full table raw clickable everywhere.
- ~~Make a dentist question answer to place below the doctors answers in PDF~~
	- 2026-09-19-22-24-09
- ~~When we convert a patient from the clinical referral submission the patients guardians or email is not getting capturing for only minor patient convertion.~~
- ~~Make the logo fully transparent in the signature fieald~~
- ~~Create a saperate signature fieald based on the parents relations, remove the slots configurations, remove the parent relation ship mapping control from the fieald inspector now it has a seperate signature fiealds configured based on the configured relations.~~
- ~~Missing parents form in patient management, admin should also edit their clinic patient~~
- ~~if more then one signature in the same document only show a single signature control to capture, and rest will get the same signature auto applied.~~
- ~~whatapp like reply functionality to add in chat composer~~
- ~~When the doctor sends a consultation, the dentist view currently displays the old Clinical Response form, which is not needed. As discussed, it should open the same form currently shown under **Confirm and Close**.~~
- ~~Email templates required to provide option 1, option 2, option 3~~
- ~~When converting patient, address field be consistent across entire smile konnect app and in four field street address, city, state and postal code.~~
- ~~Schedule Apoinment and Book Apoinment is confusing and use same terminology everywhere and avoid unnecessary placement of button and keep the consistent.~~
- ~~Currently I am testing at 10:11 Pm on September 17 but apoinment booking allow to past time see the screenshot which allow 17 september 11:30 am which is incorrect it should be future date and time when opening and also no indicator once click on book so handle proper state management for loading~~
- ~~Order should be Overview -> Activity & out reach  -> Apoinment -> Patient Qustionaries -> Consent -> Clinical care plan~~
- ~~Mandotory parents required to sign behalf of their child so it should not only send to patient.~~
- ~~None of the above in the Pre-Orthodontic Medical Questionnaire should be top position~~
- ~~View PDF option is missing in Pre-Orthodontic Medical Questionnaire & E-Signature for admin, dentist and hygienist view~~
- ~~PRE-ORTHODONTIC MEDICAL QUESTIONNAIRE need proper formating professional~~
- ~~If there is two parents and while designing the form if we place Parent/Gurdian full name and Parent/Guardian Relationship and if that patient has both the parent's recorded in that form so whom it form goes to sign.~~
	- [[image_1789698498193_0]]
- ~~See the below screenshot already signature template is available but when admin try to triger consent it is giving attached error and also signature template not loaded but dentist can able to trigger it but admin should also trigger it.~~
- ~~Dentist send consent form to patient parent and it does sent but parent didn't receive the consent form.~~
	- [[image_1789698799099_0]]
	-
	- [[image_1789698813105_0]]
	- [[image_1789698836834_0]]
- ~~Allow admin or dentist to update the email incase hygist not provided while submiting referal~~
- ~~Provide dentist side to set treatment plan~~
- ~~Discount is missing on dentist side when patient signature is complete~~
- ~~Once patient sign the consent form then only send patient to temporary credentials.~~
`;

const clip = {
  types: ["text/plain", "text/html"],
  getData: (type: string) =>
    type === "text/plain"
      ? text
      : type === "text/html"
        ? "<ul><li>short html only</li></ul>"
        : "",
  files: [],
  items: [],
} as unknown as DataTransfer;

const prepared = await prepareLogseqPaste(clip, { byName: new Map(), ordered: [] });
const items = listItemsFromPaste(prepared.content);
if (!items) throw new Error("not a list");

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
if (!range) throw new Error("no range");
const nodes = items.map((item) => schema.nodeFromJSON(item));
const tr = new Transform(doc);
tr.replaceWith(range.from, range.to, nodes);
tr.doc.check();
const dumped = JSON.stringify(tr.doc.toJSON());
const need = [
  "dialogue confirmation",
  "full table raw clickable",
  "2026-09-19-22-24-09",
  "Confirm and Close",
  "image_1789698498193_0",
  "image_1789698799099_0",
  "image_1789698836834_0",
  "temporary credentials",
  "smile konnect",
];
for (const phrase of need) {
  if (!dumped.includes(phrase)) throw new Error("missing " + phrase);
}
if (!dumped.includes('"type":"bold"')) throw new Error("missing bold");
if (!dumped.includes('"type":"strike"')) throw new Error("missing strike");
console.log("items", items.length, "ok");
