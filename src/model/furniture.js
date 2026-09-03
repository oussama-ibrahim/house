import { boxFromPart } from './box.js';

/** Expands furniture pieces into their boxes; multi-part pieces get numbered ids. */
export function furnitureBoxes(pieces) {
  return pieces.map((piece) => ({
    piece,
    boxes: piece.parts.map((part, i) => {
      const id = piece.parts.length > 1 ? `${piece.id}#${i + 1}` : piece.id;
      return boxFromPart(id, part, part.material ?? piece.material, { piece: piece.id });
    }),
  }));
}
