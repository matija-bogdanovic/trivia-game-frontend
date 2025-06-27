import { cancelLeave } from "@/app/redux/slicers/room_opeations";
import { AppDispatch } from "@/app/redux/store";
import Image from "next/image";
import React from "react";
import { useDispatch } from "react-redux";

function LeaveButton() {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <button
      className="fixed right-4 top-4"
      onClick={() => {
        dispatch(cancelLeave());
      }}
    >
      <Image
        src="/leave.svg"
        height={20}
        width={24}
        alt="leaveicon"
        className="w-auto h-auto"
      />
    </button>
  );
}

export default LeaveButton;
