import { Athlete } from '@/schemas';
import { DateTime } from 'luxon';

export const formatGender = ({
  gender,
  dateOfBirth,
}: Pick<Athlete, 'gender' | 'dateOfBirth'>) => {
  const isAdult =
    Math.abs(DateTime.fromISO(dateOfBirth).diffNow('years').years) > 17;
  if (isAdult) {
    switch (gender) {
      case 'female':
        return 'Woman';
      case 'male':
        return 'Man';
      case 'nonbinary':
        return 'Non-binary';
      default:
        return 'None';
    }
  }
  switch (gender) {
    case 'female':
      return 'Young woman';
    case 'male':
      return 'Young man';
    case 'nonbinary':
      return 'Non-binary';
    default:
      return 'None';
  }
};
