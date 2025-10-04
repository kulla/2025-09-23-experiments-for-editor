const RichText = string()
const Paragraph = object({
  type: literal('paragraph'),
  content: RichText,
})

const TextContent = array(Paragraph, { htmlTag: 'div' })

const MultipleChoiceExercise = object(
  {
    exercise: TextContent,
    answers: array(
      object({
        answer: RichText,
        isCorrect: boolean(),
      }),
    ),
  },
  {
    render(node) {
      return `<div class="exercise">
        <div class="question">${node.exercise
          .map((p) => `<p>${p.content}</p>`)
          .join('')}</div>
        <ul class="answers">
          ${node.answers
            .map(
              (a) =>
                `<li><label><input type="checkbox" /> ${a.answer}</label></li>`,
            )
            .join('')}
        </ul>
      </div>`
    },
  },
)
