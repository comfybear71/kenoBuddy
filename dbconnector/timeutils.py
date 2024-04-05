# KENNOBUDDYDB/dbconnector/timeutils.py
from datetime import datetime, timezone
from dateutil import parser

def calculate_time_difference(closing):
    """
    Calculate the difference in seconds between the current UTC time and a closing time.
    
    :param closing: A string representing the closing time in a parseable format.
    :return: The difference in seconds as an integer.
    """
    utc_now = datetime.now(timezone.utc)
    closing = parser.parse(closing)
    # Set to arbitrary date for comparison
    utc_now_on_arbitrary_date = utc_now.replace(year=2000, month=1, day=1, microsecond=0)
    closing_on_arbitrary_date = closing.replace(year=2000, month=1, day=1, microsecond=0)
    # Calculate difference in seconds
    difference_in_seconds = int((closing_on_arbitrary_date - utc_now_on_arbitrary_date).total_seconds())
    
    return difference_in_seconds