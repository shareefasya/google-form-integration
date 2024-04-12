// 1. GLOBAL VARIABLES

  // 1.1 stores the Form Service script (will be set in the doPost function)
  let form;

  // 1.2 stores the form's item (will be set in the doPost function)
  let form_items;

  // 1.3 stores the form's item types
  const item_types = {
    text: "TEXT",
    multipleChoice: "MULTIPLE_CHOICE",
    paragraphText: "PARAGRAPH_TEXT",
    checkbox: "CHECKBOX",
    list: "LIST",
    scale: "SCALE",
    grid: "GRID",
    checkboxGrid: "CHECKBOX_GRID",
    date: "DATE",
    time: "TIME",
    fileUpload: "FILE_UPLOAD",
    image: "IMAGE",
    sectionHeader: "SECTION_HEADER",
    pageBreak: "PAGE_BREAK",
    video: "VIDEO",
  };






// 2. DO POST

function doPost(e) {

  // function parameter defined:
  // e -> properties sent during submission

  try {

    if ( e.parameter.formId ) { // if a form was sent in the request...

      // set the form
      form = FormApp.openById(e.parameter.formId);

      // get the form's question and layout items
      form_items = form.getItems();

    }

    // complete the request

    if ( e.parameter.request == "get-form" ) { // if the request is to retrieve the form's properies...

      // return the form's properties
      return returnFormProperties(e);

    } else if ( e.parameter.request == "submit-response" ) { // if the request to submit a response...

      // submit the response
      return submitResponse(e);

    } else if ( e.parameter.request == "get-events" ) { // if the request is for calendar events...

      // return events
      return getCalendarEvents(e);

    } else { // if the request is anything else...

      return ContentService
              .createTextOutput( JSON.stringify({result: "error", response: {message: "the request could not be completed"}}) )
              .setMimeType(ContentService.MimeType.JSON);

    }

  } catch(error) {

      return ContentService
              .createTextOutput( JSON.stringify({result: "error", response: error.stack, request: e, }) )
              .setMimeType(ContentService.MimeType.JSON);

  }

}






// 3. ACTIONS

// 3.1 returns a form's properties
function returnFormProperties(e) {

  // function parameter defined:
  // e-> properties submitted during te request

  try {  

    // store the form's properties
    let form_properties = {
      title: form.getTitle(), // form's title
      summary: form.getDescription(), // form's summary
      isAcceptingResponses: form.isAcceptingResponses(), // determines if the form is accepting responses
      hasProgressBar: form.hasProgressBar(), // determines if the form has a progress bar
      publishedURL: form.getPublishedUrl(), // returns the form's url
      items: [], // form's items
    };

    // store the form's items
    form_items.forEach( item => {

      if ( item.getType() == item_types.video || item.getType() == item_types.fileUpload ) { // if it's a video or a file...

        // skip it
        // a video's url cannot be retrieved
        // a file upload properties cannot be retreived (asFileUploadItem() does not exist)
        return;

      }      

      // get the question's (or layout's) item type

      const item_type = returnFormItemType(item); 

      let item_properties = {
        name:     item.getId(),
        label:    item.getTitle(),
        type:     item.getType(),
        isQuestion: true,
        required: isRequired(item_type)
      };

        // get the item's additional properties

        if ( item.getType() == item_types.multipleChoice || item.getType() == item_types.checkbox || item.getType() == item_types.list ) { // if it's radio buttons, checkboxes, or a select box...
            // append the choices
            item_properties.choices = returnChoices(item_type);

        } else if ( item.getType() == item_types.scale ) { // if it's a scale...

            // append the scale's range
            item_properties.range = {
              min: {
                value: item_type.getLowerBound(),
                label: item_type.getLeftLabel()
              },
              max: {
                value: item_type.getUpperBound(),
                label: item_type.getRightLabel()
              }
            };          

        } else if ( item.getType() == item_types.grid || item.getType() == item_types.checkboxGrid ) { // if it's a radio grid or checkbox grid...

            // set the item's rows
            item_properties.rows = item_type.getRows();

            // set the item's columns
            item_properties.columns = item_type.getColumns();

        } else if ( item.getType() == item_types.image ) { // if it's an image...

            // set the item's src property
            item_properties.src = "data:" + item_type.getImage().getContentType() + ";base64," + Utilities.base64Encode(item_type.getImage().getBytes());

            // update the item's isQuestion property
            item_properties.isQuestion = false;

        } else if ( item.getType() == item_types.sectionHeader || item.getType() == item_types.pageBreak ) { // if it's a section header or a page break...

            // set the item's summary property
            item_properties.summary = item_type.getHelpText();

            // update the item's isQuestion property
            item_properties.isQuestion = false;

        }

        form_properties.items.push( item_properties );

    } );

    return ContentService
            .createTextOutput( JSON.stringify({result: "success", response: form_properties}) )
            .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {

    return ContentService
            .createTextOutput( JSON.stringify({result: "error", response: error.stack, request: e}) )
            .setMimeType(ContentService.MimeType.JSON);    

  }

}

// 3.2 submits a form response
function submitResponse(e) {

  // function parameters defined:
  // e -> properties submitted during the form's submission

  try {

    // begin storing the response

    let form_response = form.createResponse();

        form_items.forEach( item => {

          // get the item's type
          const item_type = returnFormItemType(item);

          // get the single response's value
          let response_value = e.parameter[item.getId()];

            if ( isBlank(response_value) ) { // if the response's value is blank...

              // skip the response
              return;

            }

            if ( item.getType() == item_types.checkbox ) { // if it's a checkbox...

              // parse the value
              response_value = returnCheckboxValue(item, e);

            } else if ( item.getType() == item_types.date ) { // if it's a date...

              // set the value as a date object
              response_value = new Date(e.parameter[item.getId()]);

            } else if ( item.getType() == item_types.grid ) { // if it's a grid...

              // get the value for each row in the grid
              response_value = returnGridValue(item, e);

            } else if ( item.getType() == item_types.checkboxGrid ) { // if it's a checkbox grid...

                // get the value for each row in the grid
                response_value = returnCheckboxGridValues(item, e);

            }
          
          // append the single response

          if ( item.getType() == item_types.time ) { // if it's a time and the value is not blank...

            // append the time's hour and minutes
            const time = response_value.split(":");

            form_response.withItemResponse( item_type.createResponse( time[0], time[1] ) );

          } else { // if it's not a time...

            // simply append the response's value
            form_response.withItemResponse( item_type.createResponse( response_value ) );

          }

        } );

        form_response.submit();

    if ( e.parameter.calendarId ) { // if a calendar was submitted...

      // create a calendar event
      createCalendarEvent(e);

    }

    return ContentService
           .createTextOutput( JSON.stringify({result: "success", response: e}) )
           .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {

    return ContentService
            .createTextOutput( JSON.stringify({result: "error", response: error.stack, request: e}) )
            .setMimeType(ContentService.MimeType.JSON);

  }

}

// 3.3 retrieves calendar events
function getCalendarEvents(e) {

  // function parameter defined:
  // e -> properties sent during request

  try {

    // get the calendar
    const calendar = CalendarApp.getCalendarById(e.parameter.calendarId);

    // retrieve events
    const events = calendar.getEventsForDay(new Date(e.parameter.eventDate));

    // store the events
    let return_events = [];

      for ( i in events ) {

        const event = {
          start: events[i].getStartTime(),
          end: events[i].getEndTime()
        };

        return_events.push(event);

      }

    return ContentService
            .createTextOutput( JSON.stringify({result: "success", response: return_events}) )
            .setMimeType(ContentService.MimeType.JSON);    

  } catch(error) {

      return ContentService
              .createTextOutput( JSON.stringify({result: "error", response: error.stack, request: e,}) )
              .setMimeType(ContentService.MimeType.JSON);

  }

}

// 3.4 creates a calendar event
function createCalendarEvent(e) {

  // function parameter defined:
  // e -> properties sent in the resquest

  try {

    // get the event's start and end date
    let event_start_end_date = e.parameter[`${e.parameter.calendarId}_calendar`];

      if ( !isBlank(event_start_end_date) ) {

        // parse the event's start and end date
        event_start_end_date = JSON.parse(event_start_end_date);

        // get the calendar
        const calendar = CalendarApp.getCalendarById(e.parameter.calendarId);  

        // set the event's title
        const event_title = `Event created via ${form.getTitle()}`; 

        // set the event's options
        let event_options = {};

          // set the description
          event_options.description = "";

            // append the form response to the description
            const form_response = serializeFormResponse(e);

            form_response.forEach( ( field, f ) => {

              if ( field.type == item_types.grid || field.type == item_types.checkboxGrid ) {

                return;

              }

              event_options.description += `${field.label}: ${field.value}`;

              if ( f < (form_response.length - 1) ) {

                event_options.description += "\n";

              }

            } );

        // create the event
        let event = calendar.createEvent(event_title, new Date(event_start_end_date.start), new Date(event_start_end_date.end), event_options);

      }

  } catch(error) {

      return error;

  }
  
}







// 4. HELPERS

// 4.1 returns a question item's choices
function returnChoices(question) {

  // function parameter defined:
  // question -> question item's properties

  // append the choices
  let choices = [];

  const get_question_choices = question.getChoices();

  get_question_choices.forEach( choice => {

    choices.push( choice.getValue() );

  } );

  return choices;

}

// 4.2 determines if a question item is required
function isRequired(question) {

  // function parameter defined:
  // question -> form's question item

  let isRequired = false;

    if ( "isRequired" in question ) {

      isRequired = question.isRequired();

    }

  return isRequired;

}

// 4.3 returns a form item's type
function returnFormItemType(item) {

  // function parameter defined:
  // item -> a form item

  // will store the form item's type
  let item_type;

      if ( item.getType() == item_types.text ) { // if it's a text box...

        // set the item type as text
        item_type = item.asTextItem();            

      } else if ( item.getType() == item_types.multipleChoice ) { // if it's radio buttons...

        // set the item type as multiple choice
        item_type = item.asMultipleChoiceItem();

      } else if ( item.getType() == item_types.paragraphText ) { // if it's a textarea

        // set the item type as paragraph 
        item_type = item.asParagraphTextItem();            

      } else if ( item.getType() == item_types.checkbox ) { // if it's a checkbox...

        // set the item type as checkbox
        item_type = item.asCheckboxItem();           

      } else if ( item.getType() == item_types.list ) { // if it's a select box...

        // set the item type as list
        item_type = item.asListItem();

      } else if ( item.getType() == item_types.scale ) { // if it's a scale

        // set the item type as scale
        item_type = item.asScaleItem();         

      } else if ( item.getType() == item_types.grid ) { // if it's a radio grid...

        // set the item type as grid
        item_type = item.asGridItem();

      } else if ( item.getType() == item_types.checkboxGrid ) { // if it's a checkbox grid...

        // set the item type as checkbox grid
        item_type = item.asCheckboxGridItem();

      } else if ( item.getType() == item_types.date ) { // if it's a date...

        // set the item type as date
        item_type = item.asDateItem();

      } else if ( item.getType() == item_types.time ) { // if it's a time...

        // set the item type as time
        item_type = item.asTimeItem();

      } else if ( item.getType() == item_types.image ) { // if it's an image...

        // set the item type as image
        item_type = item.asImageItem();

      } else if ( item.getType() == item_types.sectionHeader ) { // if it's a section header...

        // set the item's item type as section
        item_type = item.asSectionHeaderItem();

      } else if ( item.getType() == item_types.pageBreak ) { // if it's a page break...

        // set the item type as page break
        item_type = item.asPageBreakItem();

      } else if ( item.getType() == item_types.video ) { // if it's a video...

        // set the item type as video
        item_type = item.asVideoItem();

      }

      return item_type; 

}

// 4.4 checks if a string is empty
function isBlank(str) {
            
  // method parameter defined: 
  // str -> string/text
          
  return (!str || /^\s*$/.test(str));
                    
}

// 4.5 serializes the form's submission
function serializeFormResponse(response) {

  // function parameters defined:
  // response -> the form's submission

  let serialize = [];

    form_items.forEach( item => {

      let response_value = response.parameter[item.getId()];

        if ( isBlank(response_value) ) {

          return;

        }       

      let serial = {
        label: item.getTitle(),
        value: response_value,
        type: item.getType()
      };

        if ( item.getType() == item_types.checkbox ) {

          serial.value = returnCheckboxValue(item, response);

        } else if ( item.getType() == item_types.grid ) {

          serial.value = returnGridValue(item, response);

        } else if ( item.getType() == item_types.checkboxGrid ) {

          serial.value = returnCheckboxGridValues(item, response);

        }

        serialize.push(serial);

    } );

    return serialize;  

}

// 4.6 returns a checkboxe's values
function returnCheckboxValue(item, response) {

  // get the item's type
  let item_type = returnFormItemType(item); 

  // will the checkbox values
  let checkbox_values = [];

  // get the checkboxes
  const checkboxes = returnChoices(item_type);

  checkboxes.forEach( (checkbox, c) => {

    // set the checkbox's id
    const checkbox_id = `${item.getId()}_${c}`;

    if ( !isBlank(response.parameter[checkbox_id]) ) { // if the checkbox was checked...

      // store the checkboxes value
      checkbox_values.push(response.parameter[checkbox_id]);

    }
  
  } );

  return checkbox_values;

}

// 4.7 returns a grid's values
function returnGridValue(item, response) {

  // get the item's type
  let item_type = returnFormItemType(item); 

  let rows = item_type.getRows();

  let grid_values = [];

    rows.forEach( (row, r) => {

      const row_id = `${item.getId()}_${r}`;

      let value = null;

        if ( !isBlank(response.parameter[row_id]) ) {

          value = response.parameter[row_id];

        }

        grid_values.push(value);

    } );

    return grid_values;

}

// 4.8 returns a checkbox grid's values
function returnCheckboxGridValues(item, response) {

  // get the item's type
  let item_type = returnFormItemType(item);   

  let checkbox_grid_values = [];

  const rows = item_type.getRows();

  const columns = item_type.getColumns();

  rows.forEach( (row, r) => {

    let row_values = [];

    columns.forEach( (column, c) => {

      const column_id = `${item.getId()}_${r}_${c}`;

      if ( isBlank(response.parameter[column_id]) ) {

        return;

      }

      row_values.push(response.parameter[column_id]);

    } );

    if ( row_values.length == 0 ) {

      row_values = null;

    }

    checkbox_grid_values.push(row_values);

  } );

  return checkbox_grid_values;

}
