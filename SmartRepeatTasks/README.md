
# Deployment (might be incomplete)

1. Create a google sheet, open Apps Script from "Extension" -> "Apps Script"
1.1. [optional] Rename the Name of Google Sheet
2. Copy the content of `SmartRepeatTasks.gs` to the editor
2.1. [optional] Rename the script file name to `SmartRepeatTasks.gs` or anything you want

3. Initialize Tasklist and sheet used for this GAS
3.1. Add `Google Tasks API` from `Services` tab on the left panel
3.2. Save and choose the function of `Prepare`
3.3. You will be asking if allow this script to access your data. Choose allow in (more).
3.4. Copy the setting from log console
    > const tasklistId = "<tasklistid>";
    > const sheetName = "<sheetName>";

4. Setup daily trigger
4.1. Click trigger rule on left panel
4.2. Choose `Run`, `upstream`, `time trigger`, `daily`, and select any time range
4.3. Save
