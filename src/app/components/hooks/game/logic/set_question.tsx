/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDispatch } from "@/app/redux/store";
import { retrieveQuestion } from "./retrieve_question";
import { setQuestion } from "@/app/redux/slicers/question_operations";
import { setLoading } from "@/app/redux/slicers/room_opeations";

type QuestionSet = {
  lastJsonMessage: any;
  dispatch: AppDispatch;
  questionIdReference: React.RefObject<string | null>;
};

export async function setQuestions({
  lastJsonMessage,
  dispatch,
  questionIdReference,
}: QuestionSet) {
  dispatch(setLoading(false));

  const data = await retrieveQuestion({ lastJsonMessage });
  if (!data) return;

  questionIdReference.current = data.question_details.question_id;

  dispatch(
    setQuestion({
      question_text: data.question_details.question_text,
      question_id: data.question_details.question_id,
      question_options: data.question_details.formattedOptions,
    })
  );
}


