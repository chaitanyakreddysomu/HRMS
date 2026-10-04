/**
 * The whole app (web punch clock, mobile punch clock, this
 * controller's own "Late" check) treats attendance's punchIn/punchOut
 * strings as plain IST wall-clock time and the "today" boundary as
 * the IST calendar day - correct for every user, who is in India.
 *
 * That only holds if whatever builds those strings also uses IST.
 * `new Date().toTimeString()` / `.getHours()` use the SERVER's local
 * timezone instead, which is UTC on Vercel - so a 12:47 PM punch-in
 * got stored and displayed as 07:17 AM, and "hours worked since"
 * ended up inflated by the same 5.5 hour gap. Everything in this
 * file works in IST explicitly so it no longer depends on the
 * server's local timezone at all.
 */
const IST_OFFSET_MINUTES = 5 * 60 + 30;

function getISTParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (type) => Number(parts.find((p) => p.type === type).value);

    return {
        year: get('year'),
        month: get('month'),
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
        second: get('second'),
    };
}

/** The real UTC instant for a given IST wall-clock date/time. */
function istToUTC(year, month, day, hour = 0, minute = 0, second = 0, ms = 0) {
    // Date.UTC normalizes out-of-range fields (negative minutes roll
    // back into the previous hour/day), so subtracting the IST offset
    // here lands on the correct UTC instant regardless of the server's
    // own timezone.
    return new Date(Date.UTC(year, month - 1, day, hour, minute - IST_OFFSET_MINUTES, second, ms));
}

/** "HH:MM:SS" for the given instant, in IST - independent of server timezone. */
function istTimeString(date = new Date()) {
    const { hour, minute, second } = getISTParts(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

/** Start/end of "today" as an IST calendar day, as real UTC Date instants. */
function istTodayRange(date = new Date()) {
    const { year, month, day } = getISTParts(date);
    return {
        start: istToUTC(year, month, day, 0, 0, 0, 0),
        end: istToUTC(year, month, day, 23, 59, 59, 999),
    };
}

/**
 * Reconstructs the real UTC instant for an "HH:MM:SS" IST wall-clock
 * time, on the IST calendar day containing `referenceDate`.
 */
function istTimeStringToUTC(timeString, referenceDate = new Date()) {
    const [h, m, s] = String(timeString).split(':').map(Number);
    const { year, month, day } = getISTParts(referenceDate);
    return istToUTC(year, month, day, h || 0, m || 0, s || 0, 0);
}

module.exports = { getISTParts, istTimeString, istToUTC, istTodayRange, istTimeStringToUTC };
