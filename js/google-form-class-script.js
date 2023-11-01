class GoogleForm {

    // 1. CONSTRUCTOR
    constructor(properties) {

        // constructor parameter defined:
        // properties -> the form's initial properties

        // store the initial properties

        if ( properties ) {

            for ( var property in properties ) {

                this[property] = properties[property];

            }

        }

        // class's alert box
        this.alert = {
            container: this.appendElement("div", {className: "gf-alert-container gf-hide"}),
            text: this.appendElement("p", {className: "gf-alert-text"})
        };        

        // initialize the class
        this.init();

    }

    



    // 2. INITIALIZERS

    // 2.1 initializes the class
    init() {

        // initialize the wrapper
        this.initWrapper();

        // get the form's remaining properties from the google apps script

        const callback = (e) => {

            // parse the results
            const result = JSON.parse(e);

            if ( result && result.result == "success" ) { // if the result was a success...

                // get the form's remaining properties
                for ( let item in result.response ) {

                    this.form[item] = result.response[item]; 

                }

                // add a special css class to the class's wrapper
                this.wrapper.classList.add("gf-activated");

                // append progress bar
                if ( this.form.hasProgressBar ) { // if the form's hasProgressBar proeprty is set...

                    // append the progress bar
                    this.wrapper.appendChild(this.initProgressBar());

                }                    

                // initialize the form
                this.wrapper.appendChild(this.initForm());              

                if ( !this.form.isAcceptingResponses ) { // if the form is not accepting responses...

                    // disable the form
                    this.disableForm();

                }

            } else { // if the result was an error...

                // log the error
                console.error(result);

                // inform the user of the error
                this.displayAlert("An error occurred while loading the form.");

            }
            
            // hide the loader
            this.loader.classList.add("gf-hide");

        };

        this.requestDataViaAjax( {
            data: JSON.stringify( {
                formId: this.form.id,
                request: "get-form"
            } ),
            url: this.form.webAppURL
        }, callback );

    }

    // 2.2 initializes the wrapper
    initWrapper() {

        // wrapper
        this.wrapper = this.appendElement("div", {className: "gf-wrapper"});

            // initialize the loader
            this.wrapper.appendChild(this.initLoader());

            // initialize the alert box
            this.wrapper.appendChild(this.initAlert());

        if ( this.appendTo ) { // if the class's appendTo property is set...

            // append the wrapper to the element
            this.appendTo.appendChild(this.wrapper);

        } else { // if the class's appendTo property is not set...

            // append the wrapper to the document's body
            document.body.appendChild(this.wrapper);

        }

    }

    // 2.3 initializes the loader
    initLoader() {

        // loader wrapper
        this.loader = this.appendElement("div", {className: "gf-loader-wrapper"});

            // loader
            this.loader.appendChild(this.appendElement("div", {className: "gf-loader"}));

        return this.loader;

    }

    // 2.4 initializes the alert box
    initAlert() {

        // container
        const alert = this.appendElement("div", {className: "gf-alert"});

            // title
            const title_container = this.appendElement("div", {className: "gf-alert-title-container"});

                title_container.appendChild(this.appendElement("h3", {className: "gf-alert-title", textContent: "User Message"}));

                alert.appendChild(title_container);

            // text

            const text_container = this.appendElement("div", {className: "gf-alert-content"});

                text_container.appendChild(this.alert.text);

                alert.appendChild(text_container);

            // button

            const button_container = this.appendElement("div", {className: "gf-alert-content"});

                const button = this.appendElement("button", {className: "gf-alert-button", textContent: "Okay, thanks"});
                    button.addEventListener( "click", () => {

                        this.alert.container.classList.add("gf-hide");

                    } );
                    button_container.appendChild(button);

                alert.appendChild(button_container);

            this.alert.container.appendChild(alert);

        return this.alert.container;

    }

    // 2.5 initializes the form
    initForm() {    

        // form
        this.form.html = this.appendElement("form", {className: "gf-form"});

            // overlay
            this.form.html.appendChild(this.initFormOverlay());

            // form title, fields, and layout items

            // container
            let form_content = this.appendElement("div", {className: "gf-form-content"});

                // counts page breaks
                let page_breaks = 0;

                // title and summary
                form_content.appendChild(this.initFormTitleAndSummary());                

                // append the fields and layout items
                this.form.items.forEach( item => {

                    if ( item.type == "PAGE_BREAK" ) { // if it's a page break...

                        // append previous and next button
                        const buttons_container = this.appendElement("div", {className: "gf-form-buttons"});

                            if ( page_breaks > 0 ) { // if it's not the first page break...

                                // append a previous button
                                buttons_container.appendChild(this.appendNextOrPreviousButton(page_breaks, "Previous"));

                            }

                            // append a next button
                            buttons_container.appendChild(this.appendNextOrPreviousButton(page_breaks, "Next"));

                            form_content.appendChild(buttons_container);

                        // append the fonm's content
                        this.form.html.appendChild(form_content);

                        // start another container for the remaining fields
                        form_content = this.appendElement("div", {className: "gf-form-content gf-hide"});

                        // increment the page break count
                        page_breaks += 1;

                    }
                    
                    form_content.appendChild(this.appendFieldOrLayoutItem(item));
                    
                } );

                // google recaptcha
                if ( this.recaptcha ) {

                    // append recaptcha
                    form_content.appendChild(this.initGoogleRecaptcha());

                }

                // submit button

                // container 
                const submit_button_container = this.appendElement("div", {className: "gf-form-buttons"});

                    if ( page_breaks > 0 ) { // if there are page breaks...

                        // append a previous button
                        submit_button_container.appendChild(this.appendNextOrPreviousButton(page_breaks, "Previous"));

                    }

                    submit_button_container.appendChild(this.appendSubmitButton());

                    form_content.appendChild(submit_button_container);                

                this.form.html.appendChild(form_content);

        return this.form.html;

    }

    // 2.6 initializes the form's overlay
    initFormOverlay() {

        // container
        this.form.overlay = this.appendElement("div", {className: "gf-form-overlay gf-hide"});

            // checkmark
            this.form.overlay.appendChild(this.appendElement("div", {className: "gf-form-overlay-content"}));

        return this.form.overlay;

    }

    // 2.7 initializes the form's title and summary
    initFormTitleAndSummary() {

        var title = "My Google Form";

            if ( !this.isBlank(this.form.title) ) { // if the form's title property is set...

                // update the form's title
                title = this.form.title;

            }

        return this.appendTitleandSummary(title, this.form.summary);

    }

    // 2.8 initializes google recaptcha
    initGoogleRecaptcha() {

        // recaptcha's wrapper
        const recaptcha_wrapper = this.appendElement("fieldset", {className: "gf-fieldset"});
            
            this.appendFieldsetValidation(recaptcha_wrapper);

            // container
            const recaptcha_container = this.appendElement("div", {className: "g-recaptcha"});
                recaptcha_container.dataset.sitekey = this.recaptcha.sitekey;
                recaptcha_wrapper.appendChild(recaptcha_container);

        // script
        document.body.appendChild(this.appendElement("script", {async: true, defer: true, src: "https://www.google.com/recaptcha/api.js"}))

        return recaptcha_wrapper;

    }

    // 2.9 initializes the form's progress bar
    initProgressBar() {

        // progress bar's wrapper
        const progress_bar_wrapper = this.appendElement("div", {className: "gf-progress-bar-wrapper"});

            // set the progress bar as a class property
            this.progressBar = {
                html: this.appendElement("div", {className: "gf-progress-bar"}),
                progress: {}
            };

            progress_bar_wrapper.appendChild(this.progressBar.html);

        return progress_bar_wrapper;

    }

    



    // 3. ACTIONS

    // 3.1 submits the form
    submitForm() {

        // serialize the form
        this.serializeForm();

        let callback = (e) => {

            // parse the result
            const result = JSON.parse(e);

            if ( result.result == "success" ) { // if the submission is a success...

                // check for redirect

                if ( this.redirect ) { // if the class's redirect property is set...

                    // redirect to the URL
                    window.location = this.redirect;

                } else { // if the class's redirect property is not set...

                    // close the form

                    this.form.overlay.classList.remove("gf-hide");

                    this.form.html.scrollIntoView({behavior: 'smooth'});

                }

            } else { // if an error occurred...

                // inform the user of error
                this.displayAlert("An error occurred while submitting the form.");

                // log the error
                console.error(result);

            }

            // hide the loader
            this.loader.classList.add("gf-hide");

        }

        // verify the form
        if ( this.validateForm() ) { // if the form is valid...

            // display the loader
            this.loader.classList.remove("gf-hide");

            // scroll to the loader
            this.loader.getElementsByClassName("gf-loader")[0].scrollIntoView({behavior: "smooth"});

            // submit the form
            this.requestDataViaAjax( {
                data: JSON.stringify(this.form.serialized),
                url: this.form.webAppURL
            }, callback );

        } else { // if the form is not valid...

            // scroll to the first error
            this.form.html.getElementsByClassName("gf-invalid")[0].scrollIntoView({behavior: 'smooth'});

        }

    }

    // 3.2 serializes the form
    serializeForm() {

        // serialize the fields
        this.form.serialized = this.serializeFields(this.form.html.elements);

        // add the form's id to the serialized fields
        this.form.serialized.formId = this.form.id;

        // add the form's request to the serialized fields
        this.form.serialized.request = "submit-response";

        if ( this.recaptcha ) { // if the class's recaptcha is set...

            // add the secret key to the serialized fields

            this.form.serialized.recaptchaSecretKey = this.recaptcha.secretKey;

        }

    }

    // 3.3 validates the form's submission
    validateForm() {

        return this.validateFields(this.form.serialized);

    }

    // 3.4 disables the form
    disableForm() {

        // begin disabling the form

        this.form.html.classList.add("gf-disabled");

        for ( let i = 0; i < this.form.html.elements.length; i++ ) {

            if ( this.form.html.elements[i].classList.contains("gf-fieldset") ) { // if it's a fieldset...

                // add a special css class to the fieldset
                this.form.html.elements[i].classList.add("gf-disabled");

            } else if ( this.form.html.elements[i].classList.contains("gf-field") || this.form.html.elements[i].classList.contains("gf-form-button") ) { // if it's a field or a button...

                // disable the field or button
                this.form.html.elements[i].readOnly = true;

                this.form.html.elements[i].disabled = true;

            }

        }

        // inform the user
        this.displayAlert("This form is currently not accepting responses.");

    }

    // 3.5 displays the alert box
    displayAlert(message) {

        // method parameter defined:
        // message -> the text that will be displayed in the alert box

        // clear the alert box
        this.alert.text.textContent = "";

            if ( message ) { // if the message parameter is set...

                this.alert.text.textContent = message;

            }

        // display the alert box
        this.alert.container.classList.remove("gf-hide");

        // scroll to the alert
        this.alert.container.getElementsByClassName("gf-alert")[0].scrollIntoView({behavior: 'smooth'});

    }

    // 3.7 returns a field's properties using a property
    returnFieldViaProperty(property, value) {

        // method parameters defined:
        // property -> the field's property
        // value -> the field property's value

        let return_field;

        this.form.items.forEach( field => {

            if ( field[property] == value ) { // if the field's property matches the value...

                // return field
                return_field = field;

            }

        } );

        return return_field;

    }

    // 3.8 displays a form's page break
    displayPageBreak(pageBreakIndex) {

        // method parameter defined:
        // pageBreakIndex -> the page break's index

        // hide all the breaks
        const page_breaks = this.form.html.getElementsByClassName("gf-form-content");

        Array.from( page_breaks ).forEach( page_break => {

            page_break.classList.add("gf-hide");

        } );

        // display the selected page break
        page_breaks[pageBreakIndex].classList.remove("gf-hide");

    }

    // 3.9 validates the fields in a page break
    validatePageBreak(pageBreakIndex) {

        // method parameter defined:
        // pageBreakIndex -> the page break's index

        // get the page break
        const page_break = this.form.html.getElementsByClassName("gf-form-content")[pageBreakIndex];

        // serialize the page break's fields
        const page_break_fields = this.serializeFields(page_break.querySelectorAll('[name]'));

        return this.validateFields(page_break_fields);

    }

    // 3.10 updates the form's progress bar
    updateProgressBar(isValid, fields) {

        // method parameter defined:
        // isValid -> determines if the progress should be increased or decreased
        // fields -> an object with the field_name : field_value format
       
        // store the fields
        for ( let field in fields ) {

            this.progressBar.progress[field] = isValid;

        }

        // count the number of valid fields
        let valid_field_count = 0;

        for ( let item in this.progressBar.progress ) {

            if ( this.progressBar.progress[item] ) {

                valid_field_count++;

            }

        }

        // update the progress bar
        this.progressBar.html.style.width = `${(valid_field_count/Object.keys(this.serializeFields(this.form.html.elements)).length)*100}%`;

    }







    // 4. BUILDERS
    
    // 4.1 builds an html element
    appendElement(element, attributes) {
	
        // function parameters defined:
        // element -> the html element that will be created
        // attributes -> an object of the element's attributes
            
        // build the html element
        let html_element = document.createElement(element);
                
            if ( attributes ) { // if the attributes parameter is set...
                
                // set the elements attributes

                for ( var attribute in attributes ) {
                            
                    html_element[attribute] = attributes[attribute];
                        
                }                
                    
            }
                
        return html_element;		
        
    }
    
    // 4.2 build a form field
    appendField(field) {

        // method parameter defined:
        // field => an object that contains the fields properties

        // fieldset
        const fieldset = this.appendElement("fieldset", {className: "gf-fieldset", id: `${field.name}_fieldset`});     

            // append validation
            this.appendFieldsetValidation(fieldset);

            // label
            let label = this.appendElement("label", {className: "gf-field-label", id: `${field.name}_label`, htmlFor: field.name, textContent: "Field Label"});
                
                if ( !this.isBlank(field.label) ) { // if the field has a label

                    // set the label's text
                    label.textContent = field.label;

                }

                if ( field.required ) { // if the field is required...

                    // add an asterisk to the label
                    label.textContent += " *";

                }

                fieldset.appendChild(label);

            // field
            if ( field.type == "MULTIPLE_CHOICE" ) { // if it's radio buttons...

                // append the radio buttons
                field.choices.forEach( (choice, index) => {

                    let radio_id = field.name;

                        if ( index > 0 ) {

                            radio_id = `${field.name}_${index}`;

                        }

                    // radio button
                    fieldset.appendChild(this.appendElement("input", {className: "gf-field", id: radio_id, name: field.name, value: choice, required: field.required, type: "radio"}));

                    // radio button's label
                    fieldset.appendChild(this.appendElement("label", {className: "gf-radio-label", htmlFor: radio_id, textContent: choice}));

                } );

            } else if ( field.type == "PARAGRAPH_TEXT" ) { // if it's a textarea...

                // append a textarea
                fieldset.appendChild(this.appendElement("textarea", {className: "gf-field", id: field.name, required: field.required, placeholder: "Your answer", name: field.name}));

            } else if ( field.type == "LIST" ) { // if it's a select box...

                // append a select box
                let select = this.appendElement("select", {className: "gf-field", id: field.name, required: field.required, name: field.name});

                    // default option
                    select.appendChild(this.appendElement("option", {text: "Select option", value: ""}));

                    // append remaining options
                    field.choices.forEach( choice => {

                        select.appendChild(this.appendElement("option", {text: choice, value: choice}));

                    } );

                    fieldset.appendChild(select);

            } else if ( field.type == "CHECKBOX" ) { // if it's a checkbox...

                // append a hidden field
                const hidden_field = this.appendElement("input", {type: "hidden", name: field.name, required: field.required});
                      fieldset.appendChild(hidden_field);

                // append the checkbox or checkboxes
                field.choices.forEach( (choice, index) => {

                    let checkbox_id = `${field.name}_${index}`;

                    if ( index > 0 ) { // if it's the first checkbox...

                        // set the label's for attribute to the checkbox
                        label.htmlFor = checkbox_id;

                    }

                    // checkbox
                    const checkbox = this.appendElement("input", {className: "gf-field", value: choice, id: checkbox_id, name: checkbox_id, required: field.required, type: "checkbox"});
                        checkbox.addEventListener( "click", () => {

                            // clear the hidden field
                            hidden_field.value = "";

                            // get the checkboxes
                            const checkboxes = fieldset.querySelectorAll("input[type=checkbox");

                            for ( let c = 0; c < checkboxes.length; c++ ) {

                                if ( checkboxes[c].checked ) { // if the checkbox is checked...

                                    // set the hidden field
                                    hidden_field.value = "has value";

                                }

                            }

                        } );
                        fieldset.appendChild(checkbox);

                    // label
                    fieldset.appendChild(this.appendElement("label", {className: "gf-checkbox-label", htmlFor: checkbox_id, textContent: choice}));

                } );

            } else if ( field.type == "SCALE" ) { // if it's a scale...

                // append a scale

                // container
                const scale = this.appendElement("div", {className: "gf-scale"});

                    // left label
                    if ( !this.isBlank(field.range.min.label) ) { // if there's a left label

                        // append the left label
                        scale.appendChild(this.appendElement("label", {className: "gf-scale-label", textContent: field.range.min.label}));

                    }

                    // range
                    for ( let i = field.range.min.value; i < (field.range.max.value + 1); i++ ) {

                        // single range's id
                        let range_id = field.name;

                            if ( i > field.range.min.value ) { // if it's not the integer in the range...

                                // append the integer to the id
                                range_id = `${field.name}_${i}`;

                            }

                        // radio button
                        scale.appendChild(this.appendElement("input", {className: "gf-field", type: "radio", value: i, id: range_id, required: field.required, name: field.name}));

                        // label
                        scale.appendChild(this.appendElement("label", {className: "gf-scale-option-label", textContent: i, htmlFor: range_id}));

                    }

                    // right label
                    if ( !this.isBlank(field.range.max.label) ) { // if there's a right label...

                        // append the right label
                        scale.appendChild(this.appendElement("label", {className: "gf-scale-label", textContent: field.range.max.label}));

                    }

                    fieldset.appendChild(scale);

            } else if ( field.type == "GRID" ) { // if it's a grid...

                // append a grid of radio buttons
                fieldset.appendChild(this.appendGrid(field));

            } else if ( field.type == "CHECKBOX_GRID" ) { // if it's a checkbox grid...

                // append a grid of checkboxes
                fieldset.appendChild(this.appendGrid(field));

            } else { // if it's anything else...

                // append an input
                fieldset.appendChild(this.appendElement("input", {className: "gf-field", type: field.type, id: field.name, required: field.required, placeholder: "Your answer", name: field.name}));

            }     

        return fieldset;

    } 

    // 4.3 appends a grid of fields (radio or checkbox)
    appendGrid(field) {

        // method parameter defined:
        // field -> the field's properties

        // set the input's type
        let input_type = "radio";

            if ( field.type == "CHECKBOX_GRID" ) { // if the field's type is set to checkbox grid...

                // set the input's type to checkbox
                input_type = "checkbox";

            }

        // container
        const wrapper = this.appendElement("div", {className: "gf-grid-wrapper"});

            // hidden field
            let hidden_field = this.appendElement("input", {type: "hidden", id: field.name, name: field.name});
                wrapper.appendChild( hidden_field );

            const grid = this.appendElement("div", {className: "gf-grid"});

                // append rows

                // title row
                const title_row = this.appendElement("div", {className: "gf-grid-title-row"});

                    title_row.appendChild(this.appendElement("div", {className: "gf-grid-row-column"}))

                    field.columns.forEach( column => {

                        title_row.appendChild(this.appendElement("div", {className: "gf-grid-row-column", textContent: column}));

                    } );

                    grid.appendChild(title_row);

                field.rows.forEach( (row, r) => {

                    // container
                    const row_container = this.appendElement("div", {className: "gf-grid-row"});

                        // label
                        const row_label_container = this.appendElement("div", {className: "gf-grid-row-column"});

                            row_label_container.appendChild(this.appendElement("label", {className: "gf-grid-row-label", textContent: row, htmlFor: `${field.name}_${r}_0`}));

                            row_container.appendChild(row_label_container);

                        // columns

                        let column_name = `${field.name}_${r}`;

                        field.columns.forEach( ( column, c ) => {

                            // set the column's id
                            const column_id = `${field.name}_${r}_${c}`;

                            if ( input_type == "checkbox" ) { // if it's a checkbox...

                                // set the column's name equal to the column's id
                                column_name = column_id;

                            }

                            // container
                            const column_container = this.appendElement("div", {className: "gf-grid-row-column"});

                                // input
                                let input = this.appendElement("input", {className: "gf-field", id: column_id, name: column_name, type: input_type, value: column});
                                    input.addEventListener( "click", () => {

                                        // clear the hidden field
                                        hidden_field.value = "";

                                        // get the grid's rows
                                        const rows = wrapper.getElementsByClassName("gf-grid-row");

                                        // determine if there's a checked input in each row
                                        for ( let r = 0; r < rows.length; r++ ) {

                                            const inputs = rows[r].getElementsByTagName("input");

                                            for ( let i = 0; i < inputs.length; i++ ) {

                                                if ( inputs[i].checked ) {

                                                    hidden_field.value = "has value";

                                                }

                                            }

                                        }

                                    } );
                                    column_container.appendChild(input);

                                // input's label
                                column_container.appendChild(this.appendElement("label", {className: "gf-grid-row-column-field-label", htmlFor: column_id}));

                                row_container.appendChild(column_container);

                        } );

                        grid.appendChild(row_container);
                    
                } );

                wrapper.appendChild(grid);

            return wrapper;

    }

    // 4.4 appends a form layout item
    appendFormLayoutItem(item) {

        // method parameter defined:
        // item -> an object that contains a form layout item's properties

        const wrapper = this.appendElement("div", {className: "gf-form-layout-item"});

            if ( item.type == "SECTION_HEADER" ) { // if it's a section header...

                // add a css class to the wrapper
                wrapper.classList.add("gf-has-section-header");

                // container
                const container = this.appendElement("div", {className: "gf-form-section-header-container"});

                    // title
                    const title = this.appendElement("h3", {className: "gf-form-title", textContent: "Section Header"});

                        if ( !this.isBlank(item.label) ) {

                            title.textContent = item.label;

                        }

                        container.appendChild(title);

                    // subtext
                    if ( !this.isBlank(item.summary) ) {

                        container.appendChild(this.appendElement("p", {className: "gf-form-summary", textContent: item.summary}));

                    }

                    wrapper.appendChild(container)

            } else if ( item.type == "IMAGE" ) { // if it's an image...

                // append an image

                // label
                const image_label = this.appendElement("label", {className: "gf-field-label gf-for-form-image", textContent: "Image Label"});

                    if ( !this.isBlank(item.label) ) {

                        image_label.textContent = item.label;

                    }

                    wrapper.appendChild(image_label);

                // image
                wrapper.appendChild(this.appendElement("img", {className: "gf-form-image", src: item.src}));

            } else if ( item.type == "PAGE_BREAK" ) { // if it's a page break...

                // add a special class to the wrapper
                wrapper.classList.add("gf-has-page-break");

                // append a title and summary
                wrapper.appendChild(this.appendTitleandSummary(item.label, item.summary));

            }

        return wrapper;

    }

    // 4.5 appends a field or layout item
    appendFieldOrLayoutItem(item) {

        // method parameter defined:
        // item -> an object of properties

        if ( item.isQuestion ) { // if it's a question...

            // append a form field
            return this.appendField(item);

        } else {

            // append a form layout item
            return this.appendFormLayoutItem(item);

        }        

    }

    // 4.6 appends a button
    appendButton(text) {

        const button = this.appendElement("button", {className: "gf-form-button", type: "button", textContent: "Form Button"});

            if ( !this.isBlank(text) ) { // if the button has text...

                // set the button's text
                button.textContent = text;

            }

        return button;

    }

    // 4.7 appends a submit button
    appendSubmitButton() {

        const submit_button = this.appendButton("Submit");

            submit_button.addEventListener( "click", () => {

                this.submitForm();

            } );            

        return submit_button;

    }

    // 4.8 appends a next or previous button
    appendNextOrPreviousButton(pageBreakIndex, forPreviousOrNext) {

        // method parameters defined:
        // pageBreakIndex -> the page break's index
        // forPreviousOrNext -> string determines if it's previous or next button

        // calculate the next or previous page break
        let calculate_page_break = Number(pageBreakIndex) + 1;

            if ( forPreviousOrNext == "Previous" ) { // if it's the previous button

                // recalculate the page break
                calculate_page_break = pageBreakIndex - 1;

            }

        // button
        const button = this.appendButton(forPreviousOrNext);
            
            button.addEventListener( "click", () => {

                if ( this.validatePageBreak(pageBreakIndex) ) {

                    this.displayPageBreak(calculate_page_break);

                } else {

                    const page_break = this.form.html.getElementsByClassName("gf-form-content")[pageBreakIndex];

                    page_break.getElementsByClassName("gf-invalid")[0].scrollIntoView({behavior: 'smooth'});

                }                

            } );

        return button;

    }

    // 4.9 appends a title and summary
    appendTitleandSummary(title, summary) {

        // method parameters defined:
        // title -> title's text string
        // summary -> summary's text string

         // container
         const title_summary_container = this.appendElement("div", {className: "gf-form-title-and-summary"});

            // title
            const title_element = this.appendElement("h1", {className: "gf-form-title", textContent: "Title"});
            
                if ( !this.isBlank(title) ) { // if the form has a title...

                    // set the form's title
                    title_element.textContent = title;

                }

                title_summary_container.appendChild(title_element);

            // summary
            if ( !this.isBlank(summary) ) { // if the form has a summary...

                // append the form's summary
                title_summary_container.appendChild(this.appendElement("p", {className: "gf-form-summary", textContent: summary}));

            }

        return title_summary_container;       

    }

    // 4.10 adds validation to a fieldset
    appendFieldsetValidation(fieldset) {

        // method parameter defined:
        // fieldset -> an html element

        // add focusout event to the fieldset
        fieldset.addEventListener( "focusout", () => {

            // get the fieldset's fields
            const fields = this.serializeFields(fieldset.elements);

            // validate the fieldset's fields
            const hasValidFields = this.validateFields(fields);

            if ( this.form.hasProgressBar ) { // if the fields are valid...

                // update the progress bar
                this.updateProgressBar(hasValidFields, fields);

            }

        } );

    }





    // 5. HELPERS

    // 5.1 checks if a string is empty
    isBlank(str) {
            
        // method parameter defined: 
        // str -> string/text
                
        return (!str || /^\s*$/.test(str));
                    
    }

    // 5.2 requests data via ajax request
    requestDataViaAjax(data, callback) {
            
        // method parameters defined:
        // url -> the url of the file
        // data -> the data that will be sent via ajax
        // callback -> the function that will handle the response from the ajax request
           
        // send the data via ajax
        var xhr = new XMLHttpRequest();
            xhr.open( 'POST', "./php/apps-script-connection.php", true );
            xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
            xhr.addEventListener( 'readystatechange', function(e) {
                    
                if ( this.readyState == 4 && this.status == 200 ) { // -- if the request was a success...
                        
                    // send back the response
                    if ( callback ) {
                            
                        callback(xhr.responseText);
                            
                    }
                        
                }
                    
            } );
                
            // send the data as form data
            var request = new FormData();
                
                for ( var item in data ) {
                        
                    request.append(item, data[item]);
                        
                }
                    
            xhr.send(request);          
            
    }
    
    // 5.3 serializes a group of fields
    serializeFields(fields) {

        // method parameter defined:
        // fields -> an array of html elements

        let serialize = {};

        for ( let i = 0; i < fields.length; i++ ) {

            if ( !fields[i].name || fields[i].name == "" ) { // if the field's name property is not set...

                // skip the field
                continue;

            }

            // get the field's type
            let field_type = fields[i].tagName.toLowerCase();

                if ( field_type == "input" ) { // if the field's type is set to input...

                    // update the field's type 
                    field_type = fields[i].type;

                }

            // store the serial

            if ( field_type == "checkbox" ) { // if the field is a checkbox...

                // determine the serial's value
                serialize[fields[i].name] = "";

                    if ( fields[i].checked ) {

                        serialize[fields[i].name] = fields[i].value;

                    }

            } else if ( field_type == "radio" ) { // if the field is a radio...

                // determine if the serial already has a value
                if ( serialize[fields[i].name] ) {

                    if ( fields[i].checked ) {

                        serialize[fields[i].name] = fields[i].value;

                    }

                } else {

                    serialize[fields[i].name] = "";

                        if ( fields[i].checked ) {

                            serialize[fields[i].name] = fields[i].value;

                        }

                }

            } else {

                serialize[fields[i].name] = fields[i].value;

            }
        
        }        

        return serialize;

    }

    // 5.4 validates a field
    validateField(field, value) {

        // method parameters defined:
        // field -> the field's properties
        // value -> the field's submitted value

        // determines if the field is valid
        let isValid = true;

        // get the field's fieldset
        let fieldset = document.getElementById(`${field.name}_fieldset`);
            fieldset.classList.remove("gf-invalid")

        if ( field.required && this.isBlank(value) ) { // if the field is required...

            // set the boolean as false
            isValid = false;

            // mark the field as invalid
            fieldset.classList.add("gf-invalid");

        }

        return isValid;

    }    

    // 5.5 validates a group of fields
    validateFields(fields) {

        // method parameters defined:
        // fields -> an object that is in a field_name: field_value format

        // determines if the form's submission is valid
        let isValid = true;

        for ( let field in fields ) {

            // get the field's properties
            const field_properties = this.returnFieldViaProperty("name", field);

            // determine if the field is valid
            let isFieldValid = true;

                if ( field_properties ) { // if the field's properties were found...

                    // validate it
                    isFieldValid = this.validateField( field_properties, fields[field] );

                }

            if ( !isFieldValid ) { // if the field is not valid...

                // set the boolean as false
                isValid = false;

            }

        }
        
        return isValid;

    }

}