import { toggleCancel } from "@/app/redux/slicers/room_opeations";
import { AppDispatch, RootState } from "@/app/redux/store";
import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";

type OverlayProps = {
  content: ReactNode;
};

function Overlay({ content }: OverlayProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { cancel } = useSelector((state: RootState) => state.roomOperations);
  return (
    <>
      {cancel && (
        <div className="fixed top-0 right-0 left-0 bottom-0 flex justify-center items-center">
          <div
            className="fixed top-0 right-0 bottom-0 left-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-[1]"
            onClick={() => {
              dispatch(toggleCancel());
            }}
          ></div>
          <div className="flex items-center justify-center">{content}</div>
        </div>
      )}
    </>
  );
}

export default Overlay;
