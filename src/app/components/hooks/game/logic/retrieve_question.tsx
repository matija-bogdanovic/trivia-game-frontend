/* eslint-disable @typescript-eslint/no-explicit-any */
import { Option } from "@/app/components/ui/game/question_ui";

export async function retrieveQuestion({ lastJsonMessage }: any) {
  const data = lastJsonMessage as {
    question_details: {
      question_id: string;
      type: string;
      question_text: string;
      question_options: string[];
      answer: string;
    };
  };
  if (data.question_details.question_options === undefined) return;

  const formattedOptions: Option[] = data.question_details.question_options.map(
    (opt, index) => ({
      id: index.toString(),
      question_option_text: opt.replace(/^"|"$/g, ""),
    })
  );

  return {
    question_details: {
      formattedOptions,
      question_options: data.question_details.question_options,
      type: data.question_details.type,
      question_id: data.question_details.question_id,
      question_text: data.question_details.question_text,
      correct: data.question_details.answer,
    },
  };
}
