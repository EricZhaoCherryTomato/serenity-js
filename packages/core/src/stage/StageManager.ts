import { TinyType } from 'tiny-types';

import { AsyncOperationAttempted, AsyncOperationCompleted, AsyncOperationFailed, DomainEvent } from '../events';
import { CorrelationId, Description, Duration, Timestamp } from '../model';
import { ListensToDomainEvents } from '../screenplay';
import { Clock } from './Clock';

export class StageManager {
    private readonly subscribers: ListensToDomainEvents[] = [];
    private readonly wip: WIP;

    constructor(private readonly cueTimeout: Duration, private readonly clock: Clock) {
        this.wip = new WIP(cueTimeout, clock);
    }

    register(...subscribers: ListensToDomainEvents[]) {
        this.subscribers.push(...subscribers);
    }

    deregister(subscriber: ListensToDomainEvents) {
        this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
    }

    notifyOf(event: DomainEvent): void {
        this.wip.recordIfAsync(event);

        this.subscribers.forEach(crewMember => crewMember.notifyOf(event));
    }

    waitForNextCue(): Promise<void> {
        return new Promise((resolve, reject) => {

            let interval: NodeJS.Timer,
                timeout: NodeJS.Timer;

            timeout = setTimeout(() => {
                clearInterval(interval);

                if (this.wip.hasFailedOperations()) {
                    const error = new Error(this.wip.descriptionOfFailedOperations());

                    this.wip.resetFailedOperations();

                    return reject(error);
                }

                if (this.wip.hasActiveOperations()) {
                    const error = new Error(this.wip.descriptionOfTimedOutOperations());

                    return reject(error);
                }

                // "else" can't happen because this case is covered by the interval check below

            }, this.cueTimeout.inMilliseconds());

            interval = setInterval(() => {
                if (this.wip.hasAllOperationsCompleted()) {
                    clearTimeout(timeout);
                    clearInterval(interval);

                    if (this.wip.hasFailedOperations()) {

                        const error = new Error(this.wip.descriptionOfFailedOperations());

                        this.wip.resetFailedOperations();

                        return reject(error);
                    }

                    return resolve();
                }
            }, 10);
        });
    }

    currentTime(): Timestamp {
        return this.clock.now();
    }
}

/**
 * @package
 */
class WIP {
    private readonly wip = new Map<CorrelationId, AsyncOperationDetails>();
    private readonly failedOperations: FailedAsyncOperationDetails[] = [];

    constructor(
        private readonly cueTimeout: Duration,
        private readonly clock: Clock,
    ) {
    }

    recordIfAsync(event: DomainEvent): void {
        if (event instanceof AsyncOperationAttempted) {
            this.set(event.correlationId, {
                taskDescription:    event.taskDescription,
                startedAt:          event.timestamp,
            });
        }

        if (event instanceof AsyncOperationCompleted) {
            this.delete(event.correlationId);
        }

        if (event instanceof AsyncOperationFailed) {
            const original = this.get(event.correlationId);

            this.failedOperations.push({
                taskDescription:    original.taskDescription,
                startedAt:          original.startedAt,
                duration:           event.timestamp.diff(original.startedAt),
                error:              event.error,
            });

            this.delete(event.correlationId)
        }
    }

    hasAllOperationsCompleted(): boolean {
        return this.wip.size === 0;
    }

    hasActiveOperations(): boolean {
        return this.wip.size > 0;
    }

    hasFailedOperations(): boolean {
        return this.failedOperations.length > 0;
    }

    descriptionOfTimedOutOperations(): string {
        const now = this.clock.now();

        const timedOutOperations = Array.from(this.wip.values())
            .filter(op => now.diff(op.startedAt).isGreaterThanOrEqualTo(this.cueTimeout));

        return timedOutOperations.reduce(
            (acc, op) => acc.concat(`${ now.diff(op.startedAt) } - ${ op.taskDescription.value }`),
            [`${ this.header(this.wip.size) } within a ${ this.cueTimeout } cue timeout:`],
        ).join('\n');
    }

    descriptionOfFailedOperations() {
        let message = `${ this.header(this.failedOperations.length) }:\n`;

        this.failedOperations.forEach((op: FailedAsyncOperationDetails) => {
            message += `${ op.taskDescription.value } - ${ op.error.stack }\n---\n`;
        });

        return message;
    }

    resetFailedOperations() {
        this.failedOperations.length = 0;
    }

    private header(numberOfFailures): string {
        return numberOfFailures === 1
            ? `1 async operation has failed to complete`
            : `${ numberOfFailures } async operations have failed to complete`;
    }

    private set(correlationId: CorrelationId, details: AsyncOperationDetails) {
        return this.wip.set(correlationId, details);
    }

    private get(correlationId: CorrelationId) {
        return this.wip.get(this.asReference(correlationId));
    }

    private delete(correlationId: CorrelationId) {
        this.wip.delete(this.asReference(correlationId))
    }

    private asReference(key: CorrelationId) {
        for (const [ k, v ] of this.wip.entries()) {
            if (k.equals(key)) {
                return k;
            }
        }

        return undefined;
    }
}

/**
 * @package
 */
interface AsyncOperationDetails {
    taskDescription:    Description;
    startedAt:          Timestamp;
    duration?:          Duration;
    error?:             Error;
}

/**
 * @package
 */
interface FailedAsyncOperationDetails {
    taskDescription:    Description;
    startedAt:          Timestamp;
    duration:           Duration;
    error:              Error;
}
