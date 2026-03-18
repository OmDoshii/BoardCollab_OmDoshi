import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setElements, addElement, updateElement,
  deleteElement, clearElements, setActiveUsers,
} from '../store/canvasSlice';

export function useSocket(socket, roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket || !roomId) return;

    // Receive full canvas state on join
    socket.on('room-state', ({ elements, users }) => {
      dispatch(setElements(elements));
      dispatch(setActiveUsers(users));
    });

    // Receive a draw operation from another user
    socket.on('draw-stroke', ({ operation }) => {
      const { type, element } = operation;
      if (type === 'add')    dispatch(addElement(element));
      if (type === 'update') dispatch(updateElement(element));
      if (type === 'delete') dispatch(deleteElement(element.id));
      if (type === 'clear')  dispatch(clearElements());
    });

    // User presence events
    socket.on('user-joined', ({ users }) => dispatch(setActiveUsers(users)));
    socket.on('user-left',   ({ users }) => dispatch(setActiveUsers(users)));

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 30000);

    return () => {
      socket.off('room-state');
      socket.off('draw-stroke');
      socket.off('user-joined');
      socket.off('user-left');
      clearInterval(heartbeatInterval);
    };
  }, [socket, roomId, dispatch]);
}
