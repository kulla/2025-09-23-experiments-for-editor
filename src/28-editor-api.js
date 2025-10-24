export function MultipleChoiceExercise(context) {
  const { register } = context

  const MultipleChoiceAnswer = register
    .createNodeType('MultipleChoiceAnswer')
    .extend(
      object(
        parameter('isCorrect', BooleanType(context)),
        parameter('answer', TextType(context)),
      ),
    )
    .save()

  const MultipleChoiceAnswers = register
    .createNodeType('MultipleChoiceAnswers')
    .extend(array(MultipleChoiceAnswer))
    .save()

  return register
    .createNodeType('MultipleChoiceExercise')
    .extend(
      object(
        parameter('exercise', Paragraph(context)),
        parameter('answers', MultipleChoiceAnswers),
      ),
    )
    .extend({
      render() {
        return null
      },
    })
    .save()
}
