const ScullingName = {
  '1': 'Single',
  '2': 'Double',
  '4': 'Quad',
};

const SweepName = {
  '1': 'Single',
  '2': 'Pair',
  '4': 'Four',
  '8': 'Eight',
};

type IOptions = {
  seats: '1' | '2' | '4' | '8';
  rigging?: 'sculling' | 'sweep';
};

export const formatSeatSetup = ({ seats, rigging }: IOptions) => {
  if (seats === '8') {
    return SweepName[seats];
  }
  if (rigging === 'sculling' && ScullingName[seats]) {
    return ScullingName[seats];
  }
  if (rigging === 'sweep' && SweepName[seats]) {
    return SweepName[seats];
  }
  return [ScullingName[seats], SweepName[seats]].join(' / ') || '';
};
