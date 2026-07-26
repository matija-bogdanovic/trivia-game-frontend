'use client';

import Button from '@/app/components/general/button';
import Overlay from '@/app/components/general/overlay';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import QuestionUI from '@/app/components/ui/game/question_ui';
import React from 'react';
import SideBar from './side_bar';
import StartButton from './start_button';
import LeaveButton from './leave_button';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();
function Page() {
  const { leaveRoom, overlay, onSubmitHandler } = useGame();
  const { text } = useSelector((state: RootState) => state.startGame);

  return (
    <div className="p-4 grid grid-cols-[0.3fr_1fr] grid-rows-1 w-full gap-4 h-[100vh]">
      <SideBar />
      <QuestionUI handleSubmit={onSubmitHandler} />
      <LeaveButton />
      <StartButton />
      <Overlay
        content={
          <div className="relative flex flex-col gap-4 bg-white rounded-md p-4 z-[2] m-auto">
            {text}
            <Button text={'Leave'} onClick={leaveRoom} />
          </div>
        }
      />
      {overlay ? (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-[1]">
          {text && (
            <div className="relative flex flex-col gap-4 bg-white rounded-md p-4 z-[2] m-auto">
              <p>{text}</p>
            </div>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default Page;
