import { atom } from 'jotai';
import { IContract } from '../types/contractTypes';

export interface IContractWithDescription extends IContract {
  description?: string;
}

export const allContractsMapState = atom<Record<string, IContractWithDescription>>({});

