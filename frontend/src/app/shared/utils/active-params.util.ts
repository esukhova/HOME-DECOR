import {ActiveParamsType} from '../../types/active-params.type';
import {Params} from '@angular/router';

export class ActiveParamsUtil {
  static processParams(queryParams: Params): ActiveParamsType {
    const activeParams: ActiveParamsType = {types: []};

    if (queryParams.hasOwnProperty('types')) {
      activeParams.types = Array.isArray(queryParams['types']) ? queryParams['types'] : [queryParams['types']];
    }

    if (queryParams.hasOwnProperty('diameterFrom')) {
      activeParams.diameterFrom = queryParams['diameterFrom'];
    }

    if (queryParams.hasOwnProperty('diameterTo')) {
      activeParams.diameterTo = queryParams['diameterTo'];
    }

    if (queryParams.hasOwnProperty('heightFrom')) {
      activeParams.heightFrom = queryParams['heightFrom'];
    }

    if (queryParams.hasOwnProperty('heightTo')) {
      activeParams.heightTo = queryParams['heightTo'];
    }

    if (queryParams.hasOwnProperty('sort')) {
      activeParams.sort = queryParams['sort'];
    }

    if (queryParams.hasOwnProperty('page')) {
      activeParams.page = +queryParams['page'];
    }

    return activeParams;
  }
}
