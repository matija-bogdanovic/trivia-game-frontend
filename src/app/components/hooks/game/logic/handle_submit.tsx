import { HandleSubmitTypes } from '@/app/helpers/types';
import { submittedText } from '@/app/redux/slicers/loop_and_overlay_slice';

export const handleSubmit = async (
  e: React.FormEvent,
  {
    selectedOption,
    questionIdReference,
    questionOptions,
    sendJsonMessage,
    decodedToken,
    dispatch,
  }: HandleSubmitTypes
) => {
  e.preventDefault();

  if (!selectedOption) {
    dispatch(submittedText('Please select an option first.'));
    return;
  }
  try {
    const roomCode = window.location.pathname.split('/')[2];

    sendJsonMessage({
      message: 'submit_answer',
      roomCode: roomCode,
      username: decodedToken.username,
      questionId: questionIdReference.current,
      selectedOption: questionOptions.find(
        (opt) => opt.question_option_text === selectedOption
      )?.question_option_text,
    });
    const firstTimer = setTimeout(() => {
      const roomCode = window.location.pathname.split('/')[2];

      sendJsonMessage({ message: 'question_retrieval', code: roomCode });
      clearTimeout(firstTimer);
    }, 1000);
    const secondTimer = setTimeout(() => {
      sendJsonMessage({
        message: 'change_current_player',
        code: roomCode,
      });
      clearTimeout(secondTimer);
    }, 3000);
  } catch (error) {
    console.error('Something went wrong', error);
    dispatch(submittedText('Error connecting to the server.'));
  }
};
