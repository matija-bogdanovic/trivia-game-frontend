import React from 'react';
import Button from '../../general/button';
import Input from '../../general/input';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { setSelectedOption } from '@/app/redux/slicers/question_operations';

export interface Option {
  id: string;
  question_option_text: string;
  status?: true | false;
}

export interface QuestionUIProps {
  handleSubmit: (e: React.FormEvent) => void;
}

function QuestionUI({ handleSubmit }: QuestionUIProps) {
  const dispatch = useDispatch();
  const { questionText, questionOptions, selectedOption, submittedText } =
    useSelector((state: RootState) => state.questionSettings);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedOption(e.target.value));
  };
  return (
    <div className="flex flex-col gap-4 h-full w-full justify-start items-center">
      <div className="flex flex-col w-full gap-4">
        <strong className="text-[20px]">{questionText}</strong>
        <form
          className="flex flex-col gap-4 h-full w-full"
          onSubmit={handleSubmit}
        >
          {!questionOptions || questionOptions.length === 0 ? (
            <>
              <div className="h-full flex flex-col w-full justify-center items-center">
                <span>
                  Waiting on the host to start the game&#46;&#46;&#46;
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {questionOptions.map((data: Option) => {
                  const isSelected =
                    selectedOption === data.question_option_text;
                  let optionClass = `flex items-center gap-2 cursor-pointer rounded p-2`;
                  if (data.status === true) {
                    optionClass += ' bg-green-500 text-green-800';
                  } else if (data.status === false) {
                    optionClass += ' bg-red-500 text-red-800';
                  }

                  return (
                    <label
                      key={data.question_option_text}
                      htmlFor={data.question_option_text}
                      className={optionClass}
                    >
                      <Input
                        id={data.question_option_text}
                        name="question-options"
                        type="radio"
                        value={data.question_option_text}
                        checked={isSelected}
                        onChange={handleChange}
                        className=""
                      />
                      <span>{data.question_option_text}</span>
                    </label>
                  );
                })}
              </div>
              <Button text={'Submit'} onClick={handleSubmit} />
              {submittedText && <p>{submittedText}</p>}
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default QuestionUI;
