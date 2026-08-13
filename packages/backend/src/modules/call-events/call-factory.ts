import { CallEventsService } from './call-events.service';

export type CallFn = CallEventsService['call'];

export function createCall(eventService: Pick<CallEventsService, 'call'>): CallFn {
  return eventService.call.bind(eventService) as CallFn;
}
