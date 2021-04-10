//declearing global variables
var dataTableHandle;
var smallimgBase="https://spoonacular.com/cdn/ingredients_100x100/";
var grocImg = $("#grocery-item-img");
var grocSpoonId = $("#grocery-item-spoonacularid");
var grocInfo = $("#grocery-item-info");
var grocItemId = $("#grocery-item-id");
// availablekeys:  Elmir:e52a263a34ae41e597206f99fb2dde1d, Josh:7957762824aa4703b27057bf676b5bfb, Ashton:1ab77fa9e3ec4beea75ef188f1763c1e,Todd:29ce3195c05a49faa319ee5276da513e
var spoonApiKey = "1ab77fa9e3ec4beea75ef188f1763c1e"

//running scripts after all of the doms have been generated
$(document).ready( function () {

    // initialize the datatable
    dataTableHandle = $('#grocList').DataTable({
        "lengthChange": false,
        "order": [[ 2, "desc" ]],
        "columnDefs": [
            //disabel sorting for the remove button column
            { "orderable": false, "targets": [0,3] },
            //add class to center the buttons of the remove button column
            { "className": "text_align_center", "targets": [ 0,3 ] },
        ]
    });
    //Call the fillList function to populate the datatable from local storage
    fillList();
    //Initialize the modal window (New Item Window)
    $('.modal').modal();  
} );

//spoonacular api to handle autocomplete and info of ingrediants
$("#grocery-item-input").autocomplete({
    autoFocus: true,
    source: function (request, response) {
        //autocomplete api
        $.getJSON("https://api.spoonacular.com/food/ingredients/autocomplete?query="+request.term+"&metaInformation=true&apiKey="+spoonApiKey, 
          {  }, 
          function(data) {
            var dataform=[]
              if(data){
                  dataform = data.map(function(x){
                      //build dictanary of ingrediant fields 
                      return { label: x.name, id: x.id, img:x.image }
                  })
              }
              response(dataform)
          }
        );      
    },
    //start api lookup after 2 characters input
    minLength: 2,
    //after select actions
    select: function( event, ui ) {
        //set values in the hidden fields
        grocImg.val(ui.item.img);
        grocSpoonId.val(ui.item.id);
        //array of lookup nutrients
        mainNutrients=["Cholesterol","Calories","Fat","Carbohydrates","Sugar","Protein","Fiber"]
        //api to collect ingrediant info 
        rUrl="https://api.spoonacular.com/food/ingredients/"+ui.item.id+"/information?amount=1&apiKey="+spoonApiKey
        $.get(rUrl, function() {}).done(function(data) { 
            nutrients=""
            for(i of mainNutrients){
                for(x of data.nutrition.nutrients){                   
                    if (i===x.name){
                        //append string of html
                        nutrients += "<span class='inginfo'><strong>"+x.name+"</strong>:"+x.amount+x.unit+"</span>&nbsp &nbsp"
                    }
                }
            }
            //add built html string into the hidden textarea
            grocInfo.val(nutrients);
            
        });
    },
});

//Array for storing current grocery entries
var groceryItemArray = [];

//Variables for grocery table
var groceryTableListElement = $("#grocery-table")

//Varaibles for "New Item" button
var newItemButtonElement = $("#new-item-button");
var newItemFormElement = $('#new-item-modal');

//Variables for modal 
var groceryItemInputElement = $('#grocery-item-input');
var expirationDateInputElement = $('.datepicker');  
var submitGroceryItemElement = $('#submit-grocery-item');

//reset Form 
newItemButtonElement.on("click",function(){
    newItemFormElement.removeAttr("data-editing");
    groceryItemInputElement.val('');
    expirationDateInputElement.val('');
    $("#modal_title").text("New Ingredient");
    grocImg.val("");
    grocSpoonId.val("");
    grocInfo.val("");
    grocItemId.val("");
});

var testDiv = $('#text-div')

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
        $("#ingInfo_"+obj_id).html(newItem.ingrediantInfo)

        checkedImg="./Images/placeholder.jpg"
        if (newItem.ingrediantImg){
            checkedImg=smallimgBase+newItem.ingrediantImg
        }
        $("#ingImg_"+obj_id).attr("src",checkedImg)

        //remove old item from storage 

        remove_from_storage(parseInt(obj_id));
        //push the new item to the array to be added to the localStorage
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
  
    //Add items to local storage
    groceryItemArray.push(newItem);
    localStorage.setItem("groceryItemArray", JSON.stringify(groceryItemArray));

}

function addRow(newItem,editing=false) {
    //creating the remove button elements of the row
    let newButton = $(document.createElement('td'))
    let aTag = $(document.createElement('a'));
    let iTag = $(document.createElement('i'));
    
    //setting button attributes
    aTag.addClass('delete_grocery');
    aTag.attr('href','#');
    aTag.attr('data-id', newItem.id);
    iTag.addClass('far fa-window-close fa-w-16 fa-2x');
    
    // Assemble tags
    aTag.append(iTag);
    newButton.append(aTag);
    newButton.append('&nbsp;&nbsp;<a data-target="new-item-modal" class="edit_grocery modal-trigger" href="#" id="editbutton_'+newItem.id+'" data-id="'+newItem.id+'" data-info="'+newItem.ingrediantInfo+'" data-img="'+newItem.ingrediantImg+'" data-spid="'+newItem.spoonacularId+'"><i class="far fa-edit fa-w-16 fa-2x"></i></a>');
    checkedImg="./Images/placeholder.jpg"
    if (newItem.ingrediantImg){
        checkedImg=smallimgBase+newItem.ingrediantImg
    }
    //set a handle for the new row, added the .html() to the generated button tag, .node() to create a node of the row
    var newRow = dataTableHandle.row.add(
        ['<img id="ingImg_'+newItem.id+'" src="'+checkedImg+'"/>',
        '<span class="ingrediantname" id="ingl_'+newItem.id+'">'+newItem.label+'</span><br><span id="ingInfo_'+newItem.id+'">'+newItem.ingrediantInfo+'</span>',
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
    //set values in fields
    grocSpoonId.val(sponid)
    grocImg.val(img)
    grocInfo.val(info)
    grocItemId.val(grocId)
});

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

//Event delegation for removing rows from the data table
$('#grocList').on('click', ".delete_grocery", function(event){
    event.preventDefault();
    //-----Delete row from data table-----
    dataTableHandle.row($(this).parents('tr')).remove().draw();

    //-----Delete entry from current grocery item array-----

    //Get Id from selected element by accessing the data attribute
    let removeId = $(this).data('id');
    remove_from_storage(removeId);
})

