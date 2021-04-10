var dataTableHandle;
var selectedGroceries = [];
var requestUrl;
var grocImg = $("#grocery-item-img");
var grocSpoonId = $("#grocery-item-spoonacularid");
var grocInfo = $("#grocery-item-info");
var grocItemId = $("#grocery-item-id");
// availablekeys:  Elmir:e52a263a34ae41e597206f99fb2dde1d, Josh:7957762824aa4703b27057bf676b5bfb, Ashton:1ab77fa9e3ec4beea75ef188f1763c1e,Todd:29ce3195c05a49faa319ee5276da513e
var spoonApiKey = "1ab77fa9e3ec4beea75ef188f1763c1e"
$(document).ready( function () {
    // initialize the datatable
    dataTableHandle = $('#grocList').DataTable({
        "lengthChange": false,
        //sorting by date column
        "order": [[ 2, "desc" ]],
        "columnDefs": [
            //disabel sorting for the remove and checkbox column
            { "orderable": false, "targets": [0,3] },
            //add class to center remove and checkbox column
            { "className": "text_align_center", "targets": [ 0,3 ] }
        ]
    });
    //Call the fillList function to populate the datatable from local storage
    fillList();
    //Call getFavourites() to get stored favourite recipes in local storage
    getFavourites(); 
    //Initialize the modal window (New Item Window)
    $('.modal').modal();  

} );

//handle the check all checkbox input
$("#checkAll").on("click",function(){
    selectedGroceries=[]
    if ($(this).prop("checked") == true){
        //add the item to the array of selectedGroceries
        $(".grocCheckbox").each(function(){
            $(this).prop('checked', true);
            selectedGroceries.push($(this).data("groceryname"));
        })
        
    }else{
        // remove item from the array of selectedGroceries
        $(".grocCheckbox").each(function(){
            $(this).prop('checked', false);
            removeFromSelectedList($(this));
        })
    }
});

//autocomplete api with ingrediant info on select
$("#grocery-item-input").autocomplete({
    autoFocus: true,
    source: function (request, response) {
        //auto complete
        $.getJSON("https://api.spoonacular.com/food/ingredients/autocomplete?query="+request.term+"&metaInformation=true&apiKey="+spoonApiKey, 
          {  }, 
          function(data) {
            var dataform=[]
              if(data){
                  dataform = data.map(function(x){
                      return { label: x.name, id: x.id, img:x.image }
                  })
              }
              response(dataform)
          }
        );      
    },
    minLength: 2,
    select: function( event, ui ) {
        //on select add values into the field
        grocImg.val(ui.item.img);
        grocSpoonId.val(ui.item.id);
        mainNutrients=["Cholesterol","Calories","Fat","Carbohydrates","Sugar","Protein","Fiber"]
        
        rUrl="https://api.spoonacular.com/food/ingredients/"+ui.item.id+"/information?amount=1&apiKey="+spoonApiKey
        // build html string of nutrients info 
        $.get(rUrl, function() {}).done(function(data) { 
            nutrients=""
            for(i of mainNutrients){
                for(x of data.nutrition.nutrients){                   
                    if (i===x.name){
                        nutrients += "<span class='inginfo'><strong>"+x.name+"</strong>:"+x.amount+x.unit+"</span>&nbsp &nbsp"
                    }
                }
            }
            // add built html string of nutrients info 
            grocInfo.val(nutrients);
            
        });
    },
});

//Array for storing current grocery entries
var groceryItemArray = [];

//Array for favourite recipes
var favouriteRecipesArray = [];

//Variables for grocery table
var groceryTableListElement = $("#grocery-table")

//Varaibles for "New Item" button
var newItemButtonElement = $("#new-item-button");
var newItemFormElement = $('#new-item-modal');

//reset Form 
newItemButtonElement.on("click",function(){
    groceryItemInputElement.val('');
    expirationDateInputElement.val('');  
    $("#modal_title").text("New Ingredient");
    $('#expiration-date-input').val('');
    $('#grocery-item-input').val('');
});


//Variables for modal 
var groceryItemInputElement = $('#grocery-item-input');
var expirationDateInputElement = $('.datepicker');  
var submitGroceryItemElement = $('#submit-grocery-item');


//Test button used to fetch sample data from the API
var generateRecipesButton = $('#generate-recipes-button');

var recipeListElement = $('#recipe-list');

var testList = $('#test-list');

// Initalize the date picker set format to day month year and to auto close when date is selected
$('.datepicker').datepicker({
    container: '.datecont',
    format:'dd-mm-yyyy',
    autoClose: true,  
});

//Function for adding/updating grocery items
function addGroceryItem(event) { 
    //Create new item to store inputted values
    var newItem;
    var obj_id = grocItemId.val()
    //Create new item to store inputted values
    existing_check = getIndexFromGroceryItemId(parseInt(obj_id));
    if(existing_check !== null){
        //get the existing item from the array
        newItem = groceryItemArray[existing_check]
         //update item
        newItem.label = groceryItemInputElement.val();
        newItem.expirationDate = expirationDateInputElement.val();
        newItem.spoonacularId = grocSpoonId.val()
        newItem.ingrediantImg = grocImg.val()
        newItem.ingrediantInfo = grocInfo.val()
        $("#editbutton_"+obj_id).attr({"data-info":newItem.ingrediantInfo,"data-img":newItem.ingrediantImg,"data-spid":newItem.spoonacularId})
        //update datatable with new values
        $("#ingl_"+obj_id).text(newItem.label)
        $("#ingex_"+obj_id).text(newItem.expirationDate)
       
        //remove old item from storage 
        remove_from_storage(parseInt(obj_id));
    }else{
        newItem = {
        "label":'',
        "expirationDate":'',
        "ingrediantImg":'',
        "ingrediantInfo":'',
        "spoonacularId":'',
        "id":''
        }
        //Add inputs from modal fields    
        newItem.label = groceryItemInputElement.val();
        newItem.expirationDate = expirationDateInputElement.val();
        newItem.spoonacularId = grocSpoonId.val()
        newItem.ingrediantImg = grocImg.val()
        newItem.ingrediantInfo = grocInfo.val()

        let newId = moment().format('X');
        newItem.id = newId;
        //Add row to table
        addRow(newItem);
    }

    groceryItemInputElement.val('');
    expirationDateInputElement.val('');
  
    //push the new item to the array to be added to the localStorage
    groceryItemArray.push(newItem);
    //Add items to local storage
    localStorage.setItem("groceryItemArray", JSON.stringify(groceryItemArray));

}

function addRow(newItem) {
    //creating the remove button elements of the row
    let newButton = $(document.createElement('td'))
    let newLabel = $(document.createElement('td'))
    let aTag = $(document.createElement('a'));
    let iTag = $(document.createElement('i'));
    //create the checkbox for selecting ingrediants
    let checkboxLabel = $(document.createElement('label'))
    let checkboxInput = $(document.createElement('input')).addClass("grocCheckbox");
    let emptySpan = $(document.createElement('span'));
    checkboxInput.attr({
        "id":"check_"+newItem.id,
        "data-groceryname":newItem.label,
        "checked":"checked",
        "type":"checkbox"
    });
    checkboxLabel.append(checkboxInput,emptySpan);
    newLabel.append(checkboxLabel);
    
    //setting button attributes
    aTag.addClass('delete_grocery');
    aTag.attr('href','#');
    aTag.attr('data-id', newItem.id);
    iTag.addClass('far fa-window-close fa-w-16 fa-2x');
    
    // Assemble tags
    aTag.append(iTag);
    newButton.append(aTag);
    newButton.append('&nbsp;&nbsp;<a data-target="new-item-modal" class="edit_grocery modal-trigger" href="#" data-id="'+newItem.id+'"><i class="far fa-edit fa-w-16 fa-2x"></i></a>');
   
    // push the new label to the array of selected groceries
    selectedGroceries.push(newItem.label);
    //set a handle for the new row, added the .html() to the generated button tag, .node() to create a node of the row
    var newRow = dataTableHandle.row.add(
        [newLabel.html(),
        '<span class="ingrediantname" id="ingl_'+newItem.id+'">'+newItem.label+'</span>',
        '<span id="ingex_'+newItem.id+'">'+newItem.expirationDate+'</span>', 
        newButton.html()]
        ).draw().node();

    // adding the id to the generated tr element
    $(newRow).attr('id','item_' + newItem.id);
}




//create function to fill data table
 function fillList () {
    var storedFood = JSON.parse(localStorage.getItem('groceryItemArray'));
    if(storedFood){
        for (var i =0; i < storedFood.length; i++){
            newItem = storedFood[i];
            addRow(newItem);
            groceryItemArray.push(newItem);
        }   
    }
}


function getFavourites(){
    let storedFavourites = JSON.parse(localStorage.getItem('favouriteRecipesArray'));
    if(storedFavourites){
        for (let i = 0; i < storedFavourites.length; i++) {
            favouriteRecipesArray.push(storedFavourites[i]);
        }
    }
}

//Helper function to return the groceryItemArray index of the element with the matching id
function getIndexFromGroceryItemId(groceryItemId){
    let targetIndex = -1;

    //Check for item with matching id in the current grocery array
    for (let i = 0; i < groceryItemArray.length; i++) {
        const element = groceryItemArray[i];

        //Check if id's match
        if(+element.id === groceryItemId){
            //If they do match, get the index
            targetIndex = i;
        }
    }

    //Check if the target index exists.If it does, return it. Otherwise, return null.
    if(targetIndex === -1){
        return null;
    }else{
        return targetIndex;
    }
}


// helper function to handle removal of the item from the selelcted list when checkmark is unchecked and the button to remove the item is pressed
function removeFromSelectedList(object){
    //itterate over not just last seen but the entire array in case grocery is repeated
    for( var i = 0; i < selectedGroceries.length; i++){ 
        //using splice to remove the objects based on the grocery name from the selectedGroceries array
        if ( selectedGroceries[i] === object.data("groceryname")) { 
            selectedGroceries.splice(i, 1); 
          i--; 
        }}
}


//handle check and uncheck select checkbox events
$("body").on('click',".grocCheckbox", function(){
    //on change if this checkbox is checked
    if ($(this).prop("checked") == true){
        //add the item to the array of selectedGroceries
        selectedGroceries.push($(this).data("groceryname"));
    }else{
        // remove item from the array of selectedGroceries
        removeFromSelectedList($(this));
    }
});

//edit gorceries
$("body").on("click", ".edit_grocery", function(){
    var grocId = $(this).data("id");
    var img = $(this).data("img");
    var sponid = $(this).data("spid");
    var info = $(this).data("info");
    $("#expiration-date-input").val($("#ingex_"+grocId).text());
    $("#grocery-item-input").val($("#ingl_"+grocId).text());
    $("#modal_title").text($("#ingl_"+grocId).text());
    $("#new-item-modal").attr("data-editing",grocId);
    // set new values in hidden fields for form submission
    grocSpoonId.val(sponid)
    grocImg.val(img)
    grocInfo.val(info)
    grocItemId.val(grocId)
});


function createRecipeCards(recipes) {
    //First, reset html content 
    recipeListElement.html('');

    recipes.forEach(element => {
        let recipeCard = createRecipeCard(element.recipe);
    });    
}

function createRecipeCard(recipe) {
    //Get ingredients
    let ingredientsArray = [];
    
    recipe.ingredients.forEach(element => {
        ingredientsArray.push(element.text);
    });

    let ingredientList = $(document.createElement('ul'));

    ingredientsArray.forEach(element => {
        let ingredientItem =  $(document.createElement("li"));

        ingredientItem.text(element);

        ingredientList.append(ingredientItem);
        
    });

    //Create html element
    let recipeCard = $('<div class="col s12 m7" id="recipe-card"><div class="card horizontal recipe-card-id"><div class="card-image"><img src="'+recipe.image+'"></div><div class="card-stacked"><div class="card-content"><div class="card-header"><h5>'+recipe.label+'</h5></div><p>Servings: '+recipe.yield+'</p>Ingredients:<div class="recipe_ingredient_list"> '+ingredientList.html()+'</div></div><div class="card-link card-footer"><a href="'+recipe.url+'" target="_blank" style="color: slateblue"><i class="material-icons">link</i><span>View Recipe</span></a><button class="btn deep-purple recipe-save-button"><i class="material-icons">add</i>Save Recipe</div></div></div></div></div>)');    

    //Check if the new recipe is already favourited and style accordingly
    let recipeId = recipeCard.find('h5').text();

    let alreadyFavourited = checkIfFavourite(recipeId);

    if(alreadyFavourited){
        recipeCard.find('.card-header').append('<i class="material-icons favourite">favorite</i>')
        //Remove save button
        recipeCard.find('button').remove()
    }

    //Append to the current recipe list
    recipeListElement.append(recipeCard)
}



//Event handling for "Submit" button in New Item menu
submitGroceryItemElement.click(addGroceryItem);

//remove object from the localstorage
function remove_from_storage(removeId){
    let index = getIndexFromGroceryItemId(removeId);

    if(index !== null){
        //Remove using splice method             
        groceryItemArray.splice(index,1)
        //-----Update local storage-----
        localStorage.setItem("groceryItemArray", JSON.stringify(groceryItemArray));
    }else{
        console.error('TARGET INDEX NOT FOUND IN GROCERY ITEMS ARRAY')
    }
}

function checkIfFavourite(recipeName) {
    let favourited = false;
    for (let i = 0; i < favouriteRecipesArray.length; i++) {
        const element = favouriteRecipesArray[i];
        if(recipeName.localeCompare(element.id)===0){
            //Then recipe is already favourited
            favourited = true;
        }
    }

    return favourited;
}


generateRecipesButton.click(function (params) {
    //finaly set the requestUrl with the new selected options
    requestUrl = 'https://api.edamam.com/search?q='+selectedGroceries.join("+")+'&app_id=03d33e60&app_key=82cdeff85835203474becaab930c556c&from=0&to=5&calories=591-722&health=alcohol-free'; 
    
    fetch(requestUrl, {
        // The browser fetches the resource from the remote server without first looking in the cache.
        // The browser will then update the cache with the downloaded resource.
        cache: 'reload',
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            createRecipeCards(data.hits);
    });
});

//Event delegation for removing rows from the data table
$('#grocList').on('click', ".delete_grocery", function(event){
    event.preventDefault();
    //Get Id from selected element by accessing the data attribute
    let removeId = $(this).data('id');

    // first remove item from the selected List
    removeFromSelectedList($("#check_"+removeId))

    //-----Delete row from data table-----
    dataTableHandle.row($(this).parents('tr')).remove().draw();

    //-----Delete entry from current grocery item array-----


    remove_from_storage(removeId);

})

//Event delegation for saving recipes to localstorage
$("#recipe-list").on('click', '.recipe-save-button', function(){
    
    //Get Recipe Card HTML
    let recipeCard = $($(this).parents('#recipe-card').html());

    //Get id (Name of recipe) from current html
    let recipeId = recipeCard.find('h5').text()

    let alreadyFavourited = checkIfFavourite(recipeId);

    if(!alreadyFavourited){
        //Remove save button from saved html
        recipeCard.find('button').remove();

        //Add heart icon
        $(this).parents('#recipe-card').find('.card-header').append('<i class="material-icons favourite">favorite</i>');
            
        //testList.append(recipeCard);

        let newFavourite = {
            id:'',
            html:''
        }
        //---Add new values to item---
        newFavourite.id = recipeId;

        newFavourite.html = recipeCard.html();

        //Push to favourites array
        favouriteRecipesArray.push(newFavourite);

        //Update localStorage
        localStorage.setItem("favouriteRecipesArray", JSON.stringify(favouriteRecipesArray));
    }
    
    //Remove button 
    $(this).remove()

})










