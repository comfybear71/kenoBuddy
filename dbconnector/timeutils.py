# KENNOBUDDYDB/dbconnector/timeutils.py
from datetime import datetime, timezone
from dateutil import parser

def calculate_time_difference(closing):
    # print(closing)
    
    if closing is None:
        print("Closing time is not provided.")
        return None
    else:
        # Correctly parse the closing time string into a datetime object
        closing_datetime = parser.parse(closing)
    
    # Get the current UTC time as a datetime object
    utc_now = datetime.now(timezone.utc)
    
    # Normalize both times to the same arbitrary date for comparison
    utc_now_on_arbitrary_date = utc_now.replace(year=2000, month=1, day=1, microsecond=0)
    
    # Use the parsed datetime object for replacement, not the string
    closing_on_arbitrary_date = closing_datetime.replace(year=2000, month=1, day=1, microsecond=0)

    # Calculate the difference in seconds
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