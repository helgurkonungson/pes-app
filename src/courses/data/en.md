---
id: cb-data-en
version: 1
title: Data and Spreadsheets: the Basics
description: How tabular data is structured, how to keep it clean, calculate with formulas, look things up, summarise and show it honestly in charts. Works for Excel, Google Sheets and similar tools.
goal: Work confidently with spreadsheets and draw conclusions from data
language: English
minutes: 7
hue: 174
---

# data-01 | How data is organised | What tabular data is
## Rows and columns
Most work data lives in **tables**. In a well-organised table:
- each **row** is one record (one sale, one customer, one day);
- each **column** is one attribute of that record (date, amount, city);
- the first row holds the column **headers**.

This layout is called "tidy data". Formulas, filters, pivot tables and every analysis tool work with it.

## Data types
Every column has a type:
- **numbers** — you can calculate with them (sum, count);
- **text** — names, labels, categories;
- **dates and times** — inside the program these are numbers too, so you can subtract and group them;
- **logical values** — TRUE/FALSE.

A common mistake is a number stored as text (for example, "1,200 USD"). The program can't add it up. Put units in the header instead: "Amount, USD".

!key A row is one record, a column is one attribute, the first row holds headers.
!key A tidy table works with formulas, filters and pivot tables.
!key The main types: numbers, text, dates, logical values.
!key Don't mix numbers and text in a cell: units go in the header.

?q:e In a tidy table, what does one row represent?
- One attribute, such as "city"
+ One record, such as one sale
- The table title
- The total for all the data
= Rows are records, columns are attributes.

?q:m Why is "1,200 USD" in a cell a bad idea?
- It's too long
+ The program treats it as text and can't add it to other amounts
- Dollars can't be stored in spreadsheets
- The cell will turn red
= Put the units in the header: "Amount, USD".

?q:m What data type is the "Order date" column?
- Text
- Logical
- Just a meaningless number
+ Date — inside the program it's a number, so dates can be subtracted and grouped
= Dates are stored as numbers, which lets you calculate durations.

?q:h A table has columns "January", "February", "March", with sales reps in the rows. Why is this inconvenient for analysis?
+ One attribute (the month) is spread over several columns; for analysis it's better to have "Rep", "Month", "Amount" columns
- It isn't, this is the ideal layout
- Months can't be capitalised
- There are too few rows
= In tidy data, each attribute is one column.

?r:m What should be in the first row of a table?
+ Column headers
- Totals
- An empty row
- The company name
= Formulas, filters and pivot tables need headers.

?r:e What is a column in a tidy table?
- One record
+ One attribute of the records
- A random set of values
- A place for comments
= For example, "City" or "Amount".

!open Take a table from your work or life (a budget, sales, a to-do list). Describe its rows, columns and data types, and what could be improved.
!rubric Rows and columns are described
!rubric Data types are named
!rubric An improvement is suggested
!model My expenses table: a row is one purchase, the columns are date (date), category (text), amount (number), card or cash (text). Improvement: amounts are currently written as "35$", so I'll remove the "$" and put the units in the header "Amount, USD" so they can be added up.

# data-02 | How data is organised | Clean data
## Typical mess
Analysis on messy data leads to wrong conclusions. The most common problems:
- **duplicates** — the same record twice;
- **extra spaces** and different spellings: "London", "london", "London ";
- **different date formats**: 03/04/2025 and 2025-04-03 in one column;
- **merged cells** — they break sorting and filters;
- **missing values** and placeholders like "—", "n/a", or 0 instead of "no data";
- **several tables on one sheet** and totals in the middle of the data.

## How to clean
- Remove duplicates with the built-in command (Data → Remove duplicates).
- The **TRIM** function removes extra spaces; **UPPER/LOWER/PROPER** make the case consistent.
- Use **drop-down lists** (data validation) for categories so new spellings don't appear.
- An empty value and zero are not the same: 0 means "zero", an empty cell means "unknown".
- Keep the original data separately and clean a copy.

!key Messy data: duplicates, spaces, mixed formats, merged cells.
!key Zero and an empty value mean different things.
!key Drop-down lists prevent inconsistent categories.
!key Keep the original data and clean a copy.

?q:e What breaks sorting and filters most often?
- Column headers
+ Merged cells
- Numeric values
- Dates in one format
= Merged cells break the grid of rows and columns.

?q:m The "City" column contains "Leeds", "leeds" and "Leeds ". What happens when you count by city?
- Everything is counted correctly
+ The program may count them as different cities
- The table deletes the extra rows
- A formula error appears
= You need to align the case and remove spaces.

?q:m How is an empty cell different from zero in a "Revenue" column?
+ Zero means there was no revenue; an empty cell means the data is missing
- No difference
- An empty cell always means zero
- Zero means an error
= Replacing missing values with zeros distorts averages and totals.

?q:h Before analysing sales, you find duplicate orders. What's the right thing to do?
- Delete the duplicates in the original file straight away and not keep the original
+ Keep the original, find and remove the duplicates in a copy, and check how many rows were removed
- Leave the duplicates — they hardly matter
- Delete all rows with repeated amounts
= The original is your safety net; the same amount doesn't necessarily mean a duplicate.

?r:m What does the TRIM function do?
- Removes empty rows
+ Removes extra spaces in text
- Converts text to numbers
- Removes duplicates
= It helps make values consistent.

?r:e How do you prevent inconsistent spellings of categories?
+ Use a drop-down list
- Write in capitals
- Merge the cells
- Delete the column
= The list limits what can be entered.

!open Describe three data problems you've met (or could meet) in work spreadsheets and how you'd fix them.
!rubric Three specific problems
!rubric A fix for each
!rubric Working on a copy or checking the result is mentioned
!model 1) Dates in different formats — convert them to one date format and check that sorting goes by time. 2) Product names with extra spaces — apply TRIM. 3) Duplicate orders after an export — remove them with "Remove duplicates" in a copy and compare the row count before and after.

# data-03 | Formulas | Formulas and references
## How a formula works
A formula starts with the **=** sign. For example, `=B2*C2` multiplies the values in cells B2 and C2. If the source numbers change, the result recalculates by itself — that's the power of spreadsheets.

Basic functions:
- **SUM** — total: `=SUM(D2:D100)`;
- **AVERAGE** — mean;
- **COUNT** — how many cells contain numbers; **COUNTA** — how many are not empty;
- **MIN / MAX**.

In localised versions of Excel the function names may be translated, and in some regional settings arguments are separated with a semicolon instead of a comma: `=IF(A2>0;1;0)`.

## Relative and absolute references
When you copy a formula down, the references **shift**: `=B2*C2` in the next row becomes `=B3*C3`. These are **relative** references.

If a reference must stay put (for example, an exchange rate in cell F1), you lock it with dollar signs: `=B2*$F$1`. This is an **absolute** reference. In Excel the F4 key toggles the reference type.

!key A formula starts with "=" and recalculates when the data changes.
!key SUM, AVERAGE, COUNT, MIN, MAX are the basic functions.
!key Relative references shift when a formula is copied.
!key $F$1 is an absolute reference — it doesn't shift.

?q:e Which character does a formula start with?
- #
+ =
- $
- *
= The equals sign tells the program that a formula follows.

?q:m The formula =B2*C2 is copied one row down. What do you get?
- =B2*C2
+ =B3*C3
- =C2*D2
- An error
= Relative references move with the formula.

?q:m The dollar exchange rate is in cell F1. Which formula for converting the amount in B2 copies down correctly?
- =B2*F1
+ =B2*$F$1
- =$B$2*F1
- =B2+F1
= The reference to the rate must be locked with dollar signs.

?q:h How are COUNT and COUNTA different?
+ COUNT counts cells with numbers, COUNTA counts all non-empty cells
- They're the same
- COUNTA counts only empty cells
- COUNT adds the values up
= If the range contains text, the results differ.

?r:m What do the dollar signs in $F$1 mean?
- That the cell contains money
+ That the reference is absolute and doesn't shift when copied
- That the cell is password-protected
- That the formula contains an error
= The dollar sign locks the column and the row.

?r:e Which function finds the average?
- SUM
+ AVERAGE
- COUNT
- MAX
= AVERAGE divides the sum by the count of numbers.

!open You have "Price" (B) and "Quantity" (C) columns and a discount rate in cell F1. Write a formula for the discounted total in row 2 that can be copied down, and explain your choice of references.
!rubric The formula is correct
!rubric The discount is locked with an absolute reference
!rubric It explains why B2 and C2 are relative
!model =B2*C2*(1-$F$1). B2 and C2 are relative — when copied down they become B3, C3 and so on for each row. The discount rate is the same for everyone, so $F$1 is locked and doesn't shift.

# data-04 | Formulas | Conditions: IF and counting by condition
## The IF function
**IF** chooses a result based on a condition: `=IF(condition, value_if_true, value_if_false)`.

Example: `=IF(D2>=100000,"Large","Regular")` labels orders of 100,000 or more as large.

Conditions are built from comparisons: `>`, `<`, `>=`, `<=`, `=`, `<>` (not equal). Several conditions are combined with **AND** and **OR**: `=IF(AND(D2>0,E2="London"),1,0)`.

## Counting and summing by condition
- **COUNTIF** — how many cells meet a condition: `=COUNTIF(E2:E100,"London")`.
- **SUMIF** — a sum by condition: `=SUMIF(E2:E100,"London",D2:D100)` — revenue for London only.
- For several conditions there are **COUNTIFS** and **SUMIFS**.

Long chains of nested IFs are hard to read. If there are many options, it's better to set up a separate lookup table and search it — that's the next lesson.

!key IF(condition, if_true, if_false) picks a result by condition.
!key AND / OR combine several conditions.
!key COUNTIF and SUMIF count and sum by condition.
!key Many nested IFs are a sign you need a lookup table.

?q:e What does =IF(5>3,"yes","no") return?
+ "yes"
- "no"
- 5
- An error
= The condition 5>3 is true, so the second argument is returned.

?q:m Which formula counts the orders from Leeds in the range E2:E100?
- =SUM(E2:E100,"Leeds")
+ =COUNTIF(E2:E100,"Leeds")
- =IF(E2:E100="Leeds")
- =AVERAGE(E2:E100)
= COUNTIF counts the cells that meet the condition.

?q:m How do you write "not equal" in a formula?
- !=
- ><
+ <>
- =/
= In spreadsheets "not equal" is written as <>.

?q:h You need London revenue for March only; the city is in E, the month in F, revenue in D. Which function fits best?
- SUMIF with one condition
- IF without a sum
+ SUMIFS with two conditions
- COUNTIF
= SUMIFS sums by several conditions at once.

?r:m What does SUMIF do?
- Counts cells
+ Sums the values that meet a condition
- Finds the maximum
- Deletes rows by condition
= For example, revenue for one city only.

?r:e How do you combine two conditions that must both be true?
+ With the AND function
- With the OR function
- With a dollar sign
- With the SUM function
= AND returns TRUE only if all the conditions are met.

!open Think of a task from your work or daily life where IF or SUMIF would help, and write the formula.
!rubric The task is described
!rubric The formula is plausible
!rubric It explains what the formula returns
!model In my expenses table the category is in B and the amount in C. To find out how much went on groceries, I write =SUMIF(B2:B200,"Groceries",C2:C200). It adds up the amounts only in rows where the category is "Groceries".

# data-05 | Formulas | Looking up values: VLOOKUP and XLOOKUP
## Why look things up
Data often sits in different tables: one with orders and product codes, another a reference list with prices. Lookup functions pull in the right value by a key.

## VLOOKUP and XLOOKUP
**VLOOKUP** looks for a value in the first column of a range and returns the value from a given column of the same row:
`=VLOOKUP(A2,Prices!A:C,3,FALSE)`

The last argument **FALSE** means an exact match — you almost always need it. Without it, VLOOKUP may return the "nearest" value and quietly be wrong.

VLOOKUP's limits: it searches only the first column and only to the right, and the column number breaks if you insert a new column.

**XLOOKUP** in newer Excel versions and in Google Sheets is more convenient: `=XLOOKUP(A2,Prices!A:A,Prices!C:C)` — you separately say where to search and what to return; exact match is the default. The classic alternative is the **INDEX + MATCH** pair.

## The key must be unique
If the same code appears twice in the reference table, the function returns the first match — and you won't notice the error. Check keys for uniqueness.

!key Lookup functions pull values from another table by a key.
!key In VLOOKUP, use FALSE (exact match).
!key XLOOKUP is more convenient: "where to search" and "what to return" are separate.
!key The key in the reference table must be unique.

?q:e What is VLOOKUP for?
- Adding up a column
+ Finding a value by a key in another table
- Building a chart
- Removing duplicates
= VLOOKUP pulls data from a reference table.

?q:m What does FALSE mean as the last argument of VLOOKUP?
- That the formula is switched off
+ That an exact match of the key is required
- That the result will be text
- That the search goes from bottom to top
= Without an exact match VLOOKUP may return a wrong value.

?q:m How is XLOOKUP more convenient than VLOOKUP?
+ You specify separately where to search and what to return, and it can look to the left
- It only works with text
- It's quicker to type
- It doesn't need a key
= No column number is needed, so inserting columns breaks nothing.

?q:h VLOOKUP returns prices, but some are wrong. In the reference table some codes have two rows with different prices. What's happening?
- The function picks the average price
+ The function takes the first match it finds, so the key must be unique
- The function returns an error for such codes
- The function takes the last match
= Non-unique keys cause silent errors.

?r:m Which pair of functions is the classic alternative to VLOOKUP?
- SUM + COUNT
+ INDEX + MATCH
- IF + AND
- MIN + MAX
= MATCH finds the row, INDEX returns the value.

?r:e What must a key in a reference table be?
+ Unique
- Long
- Always a number
- Written in capitals
= Otherwise the lookup returns the first of several matches.

!open You have an orders table with an employee code and a separate reference table "code — name — department". Describe how you'd add each employee's department to the orders and what you'd check.
!rubric A lookup function is named
!rubric An exact match is specified
!rubric Checking key uniqueness or errors is mentioned
!model In the orders table I'll add a "Department" column with =XLOOKUP(B2,Staff!A:A,Staff!C:C), where B is the employee code. Before that I'll check that codes in the reference table don't repeat, and afterwards I'll look for #N/A errors: those are codes missing from the reference table.

# data-06 | Analysis | Sorting, filters and pivot tables
## Sorting and filters
**Sorting** orders the rows: by revenue descending, by date. Select the whole table, otherwise you may sort one column and scramble the data between rows.

A **filter** temporarily hides rows that don't meet a condition — for example, shows only one region. The data isn't deleted.

## Pivot tables
A **pivot table** turns thousands of rows into a short report in a minute. You drag fields into four areas:
- **Rows** — what to group by (for example, sales rep);
- **Columns** — a second dimension (for example, month);
- **Values** — what to calculate: sum, count, average;
- **Filters** — limit the report (for example, only 2025).

A pivot table works only on tidy data: headers in the first row, no merged cells or empty rows in the middle. After the source data changes, the pivot table must be **refreshed**.

!key Sort the whole table, not a single column.
!key A filter hides rows but doesn't delete them.
!key A pivot table has rows, columns, values and filters.
!key After the source data changes, refresh the pivot table.

?q:e What does a filter do?
- Deletes extra rows permanently
+ Temporarily hides rows that don't meet a condition
- Sorts alphabetically
- Merges cells
= Hidden rows stay in the table.

?q:m Why is it dangerous to sort just one selected column?
+ Its values get shuffled relative to other columns, and records are "torn apart"
- Sorting won't work
- The table gets smaller
- It's only dangerous for dates
= A row must stay a whole record.

?q:m You want to see revenue by sales rep by month. What goes into the pivot table's "Values"?
- Sales rep
- Month
+ Sum of revenue
- Region
= Values are what gets calculated.

?q:h You added new sales to the source table, but the pivot table shows the old totals. What's wrong?
- Pivot tables can't handle new data
+ The pivot table needs refreshing, and its range must include the new rows
- You should delete the pivot and build the report by hand
- The new sales were entered incorrectly
= A pivot table doesn't recalculate by itself like formulas do.

?r:m What are the four areas of a pivot table?
+ Rows, columns, values, filters
- Title, text, caption, total
- Cells, sheets, workbooks, files
- Sum, average, minimum, maximum
= Fields are arranged into these areas.

?r:e What kind of data does a pivot table need?
- Any, even with merged cells
+ Tidy: headers in the first row, no merged cells
- Only text
- Only a single column
= Tidy data is the basis of any analysis.

!open Describe a report you could build with a pivot table from your own data: what goes in rows, columns, values and filter, and what question it answers.
!rubric All areas are specified
!rubric The question the report answers is named
!rubric The data is realistic
!model The data is my expenses for the year. Rows — category, columns — month, values — sum of spending, filter — card only. The report answers the question of which months and categories I spend the most on.

# data-07 | Analysis | Mean, median and percentages
## Mean and median
The **mean** (average) is the sum divided by the count. The **median** is the middle value when everything is sorted. When the data has **outliers** (very large or small values), the mean shifts a lot, but the median doesn't.

Example: five employees earn 50, 55, 60, 65 and 500 thousand. The mean is 146 thousand, although four of them earn 65 or less. The median is 60 thousand and describes a typical employee better. In spreadsheets: **MEDIAN**.

## Percentages and percentage points
- Growth from 200 to 250 is **+25%**: (250 − 200) / 200.
- If conversion went from 2% to 3%, that's growth of **1 percentage point**, but **50%** in relative terms. Mixing these up is a common mistake in reports.
- A percentage of a small base is misleading: "100% growth" may mean 2 orders instead of one.

!key The median is more robust than the mean when there are outliers.
!key Percentage change = (new − old) / old.
!key Percentage points are a difference of percentages; don't confuse them with percent.
!key Look at the base: a big percentage of a small number means little.

?q:e What is the median?
- The sum of all values
+ The middle value of a sorted list
- The most frequent value
- The difference between the maximum and minimum
= Half the values are below the median, half above.

?q:m Salaries: 40, 45, 50, 55 and 400 thousand. Which measure better describes a typical salary?
- The mean — 118 thousand
+ The median — 50 thousand
- The maximum — 400 thousand
- The sum — 590 thousand
= The 400 thousand outlier pulls the mean up a lot.

?q:m Revenue grew from 160 to 200 thousand. By what percentage?
- 20%
+ 25%
- 40%
- 80%
= (200 − 160) / 160 = 0.25.

?q:h The return rate fell from 8% to 6%. How do you describe the change correctly?
- By 2% in relative terms
+ By 2 percentage points, or by 25% relative to the previous level
- By 6%
- By 33 percentage points
= 8 − 6 = 2 pp; 2 / 8 = 25%.

?r:m Why can the mean be misleading?
+ Outliers shift it a lot
- It's always lower than the median
- It can't be calculated in a spreadsheet
- It only works for dates
= In such cases look at the median.

?r:e How do you calculate a percentage change?
- New minus old
+ (New − old) / old
- New / 100
- Old / new
= Divide the change by the starting value.

!open Find a sentence with percentages in the news or a work report and check it: are percent and percentage points used correctly, and is the base too small?
!rubric A sentence or example is given
!rubric Percent or pp is checked
!rubric The base is assessed
!model A report says "the share of online sales grew by 5%": it was 20%, now it's 25%. Correctly, that's 5 percentage points, or 25% relative to the previous share. The base is fine — thousands of orders a month — so the change is meaningful.

# data-08 | Analysis | Charts that don't lie
## Choosing a chart
- **Line** — changes over time: revenue by month.
- **Bar/column** — comparing categories: sales by region. Long labels fit better on horizontal bars.
- **Pie chart** — parts of a whole, and only when there are few parts (up to 4–5). Angles are hard to compare, so bars are often better.
- **Scatter** — the relationship between two numeric measures: price and number of sales.

## Honesty
- Bars must start **at zero**: a truncated axis turns 3% growth into a "surge".
- Don't compare periods of different length without saying so.
- Label the axes and units, state the source and the period.
- One chart — one message. Highlight the main thing in colour, make the rest grey.

## Course summary
Tidy table → clean data → formulas and lookups → pivot table → correct percentages → an honest chart. That's the basic cycle of working with data in any profession.

!key Line for time, bars for comparison, pie for shares of a few parts.
!key Bars start at zero, otherwise the chart exaggerates the difference.
!key Label axes, units, source and period.
!key One chart — one message, with the main thing in colour.

?q:e Which chart best shows revenue by month over a year?
- A pie chart
+ A line chart
- A table with one number
- An unlabelled scatter plot
= A line shows changes over time well.

?q:m When is a pie chart appropriate?
- For comparing 15 regions
+ For parts of a whole when there are few parts
- For daily trends
- For the relationship between two measures
= Many slices are hard to compare.

?q:m What's the danger of a bar chart whose axis doesn't start at zero?
+ A small difference looks huge
- The chart becomes too wide
- The labels disappear
- None, it's standard
= A bar's height must be proportional to its value.

?q:h You want to check whether a product sells worse at a higher price. Which chart do you choose?
- A pie chart of price shares
+ A scatter plot of price vs. number of sales
- A line chart of price only
- Bars of product names in alphabetical order
= A scatter plot shows the relationship between two numeric measures.

?r:m What must always be labelled on a chart?
+ Axes, units, source and period
- Only the title
- Nothing, it's all obvious
- Only the background colour
= Without these a chart is easy to misread.

?r:e Which rule helps make a chart clear?
- As many colours as possible
+ One chart — one message
- Always add a 3D effect
- All labels in a small font
= Highlight the main thing and mute the rest.

!open Describe a chart you'd build for your manager from your data: what type, what's on the axes, what you'd highlight, and the one message it should get across.
!rubric The chart type fits the task
!rubric Axes and highlighting are described
!rubric One message is stated
!model I'll show a line chart of revenue by month for the year: months on the horizontal axis, revenue in thousands from zero on the vertical one. This year's line in colour, last year's in grey. The message: since we launched delivery in May, revenue has been consistently above last year.
