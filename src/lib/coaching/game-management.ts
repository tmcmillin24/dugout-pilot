import type { Board, Game } from './board';
export function removeGame(board:Board,id:string):Board {
  const index=board.games.findIndex(game=>game.id===id);if(index<0)return board;
  const games=board.games.filter(game=>game.id!==id);
  const activeGameId=games.some(game=>game.id===board.activeGameId)?board.activeGameId:games[Math.min(index,games.length-1)]?.id??'';
  return {...board,games,activeGameId};
}
export function nextGameNumber(games:Pick<Game,'label'>[]):number {
  return Math.max(games.length,...games.map(game=>Number(game.label.match(/^Game\s+(\d+)$/i)?.[1]??0)),0)+1;
}
