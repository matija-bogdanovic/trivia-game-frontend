import { Option } from '@/app/components/ui/game/question_ui';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QuestionState {
  questionOptions: Option[];
  questionText: string;
  questionId: string;
  selectedOption?: string;
  submittedText?: string | null;
}

const initialState: QuestionState = {
  questionOptions: [],
  questionText: '',
  questionId: '',
};

const questionSlicer = createSlice({
  name: 'questionSlicer',
  initialState,
  reducers: {
    setQuestion: (
      state,
      action: PayloadAction<{
        question_text: string;
        question_id: string;
        question_options: Option[];
      }>
    ) => {
      state.questionText = action.payload.question_text;
      state.questionId = action.payload.question_id;
      state.questionOptions = action.payload.question_options;
    },
    setQuestionOptionsStatus: (
      state,
      action: PayloadAction<{ correctAnswer: string }>
    ) => {
      state.questionOptions = state.questionOptions.map((opt) => ({
        ...opt,
        status:
          opt.question_option_text === action.payload.correctAnswer
            ? true
            : false,
      }));
    },

    setSelectedOption: (state, action: PayloadAction<string>) => {
      state.selectedOption = action.payload;
    },
    setSubmittedText: (state, action: PayloadAction<string | null>) => {
      state.submittedText = action.payload;
    },
  },
});

export const {
  setQuestion,
  setQuestionOptionsStatus,
  setSelectedOption,
  setSubmittedText,
} = questionSlicer.actions;
export default questionSlicer.reducer;
