import { ITrDetail } from '../../types/Transaction';

export interface ITBalanceTransaction {
  date: Date;
  number?: string;
  detail: ITrDetail;
  placeEntity?: ITrDetail['placeEntity'];
  responsibleEntity?: ITrDetail['responsibleEntity'];
  journalIndex: string;
}
