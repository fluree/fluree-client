import { SelectObject } from '../interfaces/IFlureeQuery';

type SelectString = string;

export type SelectArray = Array<SelectObject | SelectString>;

export type SelectStatement = SelectObject | SelectString | SelectArray;

export type SelectType = 'select' | 'selectOne' | 'selectDistinct';
