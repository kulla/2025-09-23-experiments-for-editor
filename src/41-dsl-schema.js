const RichTextParagraph = S.richText().withFeature('bold').withFeature('italic')

const MCAnswer = S.object({
  isTrue: S.boolean().withDefault(false),
  text: RichTextParagraph,
}).withRendering(renderFunc)

const MCExercise = S.object()
  .withProperty('question', RichTextParagraph)
  .withProperty('answer', S.array(MCAnswer))
