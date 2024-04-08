# KENNOBUDDYDB/dbconnector/timeutils.py
from datetime import datetime, timezone
from dateutil import parser

def calculate_time_difference(closing):
    if closing is None:
        print("Closing time is not provided.")
        return None
    # print('CLOSING: ', closing)
    # Check if 'closing' is a string and parse it; otherwise, use it directly
    if isinstance(closing, str):
        closing_datetime = parser.parse(closing)
        # print('IF closing_datetime', closing_datetime)
    else:
        closing_datetime = closing
        # print('ELSE closing_datetime', closing_datetime)

    # Ensure 'closing_datetime' is timezone-aware
    if closing_datetime.tzinfo is None or closing_datetime.tzinfo.utcoffset(closing_datetime) is None:
        closing_datetime = closing_datetime.replace(tzinfo=timezone.utc)

    # The following code remains unchanged as you requested
    utc_now = datetime.now(timezone.utc)
    
    # print('UTC_NOW', utc_now)
    utc_now_on_arbitrary_date = utc_now.replace(year=2000, month=1, day=1, microsecond=0)
    closing_on_arbitrary_date = closing_datetime.replace(year=2000, month=1, day=1, microsecond=0)
    difference_in_seconds = int((closing_on_arbitrary_date - utc_now_on_arbitrary_date).total_seconds())

    return difference_in_seconds


    """
    #####OLD VERSION:
    # KENNOBUDDYDB/dbconnector/timeutils.py
from datetime import datetime, timezone
from dateutil import parser

def calculate_time_difference(closing):
    ""
    Calculate the difference in seconds between the current UTC time and a closing time.
    
    :param closing: A string representing the closing time in a parseable format.
    :return: The difference in seconds as an integer.
    ""
    utc_now = datetime.now(timezone.utc)
    closing = parser.parse(closing)
    # Set to arbitrary date for comparison
    utc_now_on_arbitrary_date = utc_now.replace(year=2000, month=1, day=1, microsecond=0)
    closing_on_arbitrary_date = closing.replace(year=2000, month=1, day=1, microsecond=0)
    # Calculate difference in seconds
    difference_in_seconds = int((closing_on_arbitrary_date - utc_now_on_arbitrary_date).total_seconds())
    
    return difference_in_seconds
    """