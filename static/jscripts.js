function showBtn(divId,element)
{
	const hideSubmitBtn = $("#submit-btn-df");
	//document.getElementById(divId).style.display = parseInt(element.value.substring(2,4)) < 19 ? 'block' : 'none';  
	if (parseInt(element.value.substring(2,4)) < 19) {
		document.getElementById(divId).style.display = 'block';
		hideSubmitBtn.hide();
	} else {
		document.getElementById(divId).style.display = 'none';
		hideSubmitBtn.show();
	}
};

var data_result;


function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length) == val) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value; 
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
}


//MAIN JAVASCRIPT 
$(document).ready(function() { 
        const hideCorrPanel = $("#correlationPanel");
        const hideHmPanel = $("#heatmapPanel");
	const formHm = $("#form-wavelength");
	const panelHeadHm = $("#panelHeadHm");		
        const panelHeadLnPlt = $("#panelHeadLnPlt");
        const formLnPlt = $("#form-lineplt");
        const hmpanel = $("#innerPanelHm"); 
        const lnpanel = $("#innerPanelLnPlt");
        const formCorr = $("#form-corr");
        const corrpanel = $("div#corr_result");
	const hideBtn = $("#hidden-btn");
	var sel_pltcd = '';
	/*var firstPltCd = document.getElementsByTagName("option");
	var newWvls = [];
	for (i=220;i<810;i+=10){
			newWvls.push({
			value: `${i}`
	});
	}*/
        hideHmPanel.hide(); 
        hideCorrPanel.hide();
	
	/*showBtn('hidden-btn',firstPltCd[0]);*/

	$.ajax({
	url:"/getPltcodes/",
	dataType:'json',
	success: function(reply) {
		var pltcodeList = reply.pltcodeList
		//console.log(pltcodeList[0]);
		autocomplete(document.getElementById("ac_pltcodes"),pltcodeList);
		}
	});


	$.ajax({
	url:"/getUnqPltcodes/",
	dataType:'json',
	success: function(reply) {
		var unqPltcodeLst = reply.unqPltcodeLst
		//console.log(unqPltcodeLst[0]);
		autocomplete(document.getElementById("ac_pltcodes2"),unqPltcodeLst);
		}
	});

	//UPDATE THE HEATMAP BASED ON PRE 2019 PLATECODES:
	/*hideBtn.click(function(e)
			{
			lnpanel.hide();
			e.preventDefault();
			hmpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
		$.when(
			$.ajax({ //FIRST AJAX CALL
			url:"/updateMain/",
			data:{selected_pltcode:$("#pltcode_selector").find(":selected").text()},
			data:{selected_pltcode:$("#ac_pltcodes").val()},
			dataType:'json',
			success: function(reply) {
			$('#wavelength_selector').empty();
				$.each(reply.wavelength,function(value) {
					$('#wavelength_selector').append($("<option></option>").attr("value",value).text(reply.wavelength[value]));
			console.log('first ajax call');
				});
			$('#wavelength_selector').find(":selected").text(reply.wavelength[0]);
			panelHeadLnPlt.html(`<h3>Plate Code: ${$("#pltcode_selector").find(":selected").text()} </h3>`);
			$('#innerPanel').empty()
			}
			}),

			//SECOND AJAX CALL
			$.ajax({
			url:"/updateHeatmap/",
			//data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#pltcode_selector").find(":selected").text()},
			data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#ac_pltcodes").val()},
			dataType:'json',
			success: function(reply) {
				panelHeadHm.html(`<h3>Heatmap of ${reply.pltcode} at ${reply.selected_wavelength}nm</h3>`);
				$('#innerPanel').html(reply.htmlHeatmap);
			}
				})

		).then(function() {
			
			hideHmPanel.fadeIn(500);
		});
				return false;

			});
	*/

	//HEATMAP NORMAL
	formHm.on("submit", function(e)
			{
			e.preventDefault();
			hmpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
			$.when(
				//FIRST AJAX 
				$.ajax({
				url:"/updateHeatmap/",
				data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#ac_pltcodes").val()},
				dataType:'json',
				success: function(reply) {
					sel_pltcd = reply.pltcode;
					panelHeadHm.html(`<h3>Heatmap of ${sel_pltcd} at ${reply.selected_wavelength}nm</h3>`);
					$('#innerPanel').html(reply.htmlHeatmap).fadeIn(500);
							}
					}),
				$.ajax({
				url:'/getWavelengths/',
				data:{selected_pltcode:$("#ac_pltcodes").val()},
				dataType:'json',
				success: function(reply){
					var wvls_lst = reply.wvls;
					$('#wavelength_selector2').empty();
						$.each(wvls_lst,function(value) {
							$('#wavelength_selector2').append($("<option></option>").attr("value",value).text(wvls_lst[value]));
							});
						$('#wavelength_selector2').find(":selected").text(wvls_lst[0])
						}
					})
			).then(function() {
				hideCorrPanel.fadeIn(500);
			});
		});

	//UPDATE LINEPLOT
        formLnPlt.on("submit",function(e)
                {
		if (parseInt($("#ac_pltcodes").val().substring(2,4)) < 19)
			{
			//console.log("pre 2019");
			e.preventDefault();
			hmpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
			lnpanel.hide();
		$.when(
			$.ajax({ //FIRST AJAX CALL
			url:"/updateMain/",
			data:{selected_pltcode:$("#ac_pltcodes").val()},
			dataType:'json',
			success: function(reply) {
			$('#wavelength_selector').empty();
				$.each(reply.wavelength,function(value) {
					$('#wavelength_selector').append($("<option></option>").attr("value",value).text(reply.wavelength[value]));
				});
			$('#wavelength_selector').find(":selected").text(reply.wavelength[0]);
			panelHeadLnPlt.html(`<h3>Plate Code: ${$("#ac_pltcodes").val()} </h3>`);
				}
			}),
			//SECOND AJAX CALL
			$.ajax({
			url:"/updateHeatmap/",
			data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#ac_pltcodes").val()},
			dataType:'json',
			success: function(reply) {
				panelHeadHm.html(`<h3>Heatmap of ${reply.pltcode} at ${reply.selected_wavelength}nm</h3>`);
				$('#innerPanel').html(reply.htmlHeatmap);
					}
				})

		).then(function() {
			hideHmPanel.fadeIn(500);
			hideCorrPanel.fadeIn(500);
		});
				//return false;
		} else {
                e.preventDefault();
                lnpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
		//hideHmPanel.hide();
		hideCorrPanel.hide();
		$.when(
			$.ajax({ //FIRST AJAX CALL
			url:"/updateMain/",
			/*data:{selected_pltcode:$("#pltcode_selector").find(":selected").text()},*/
			data:{selected_pltcode:$("#ac_pltcodes").val()},
			dataType:'json',
			success: function(reply) {
			$('#wavelength_selector').empty();
				$.each(reply.wavelength,function(value) {
					$('#wavelength_selector').append($("<option></option>").attr("value",value).text(reply.wavelength[value]));
				});
			$('#wavelength_selector').find(":selected").text(reply.wavelength[0])
			}
			}),
			$.ajax({ //SECOND AJAX CALL
			url:"/updateDf/",
			data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#ac_pltcodes").val()},
			dataType:'json',
			success: function(reply) {
			    panelHeadLnPlt.html(`<h3>Absorbance Line Plots for: ${reply.pltcode} </h3>`);
			    lnpanel.html(reply.htmlLinePlt).fadeIn(500);
			    panelHeadHm.html(`<h3>Heatmap of ${reply.pltcode} at ${reply.selected_wavelength}nm</h3>`);
			    $('#innerPanel').html(reply.htmlHeatmap).fadeIn(500)
				}
			    })
		).then(function() {
			    lnpanel.fadeIn(500);
			    hideHmPanel.fadeIn(500);
			    hideCorrPanel.fadeIn(500);
			});
		}
			});

	//UPDATE CORRELATION TABLE
          formCorr.on("submit", function(e)
              {
                  e.preventDefault();
  			$.ajax({  //FIRST AJAX CALL
  			url:"/getWavelengths/",
  			data:{selected_pltcode:$("#ac_pltcodes2").val()},
  			dataType:'json',
  			success: function(reply) {
				var currentSelectedWvl = ($('#wavelength_selector2').find(":selected").text());
				$('#wavelength_selector2').empty();
					$.each(reply.wvls,function(value) {
						$('#wavelength_selector2').append($("<option></option>").attr("value",value).text(reply.wvls[value]));
				});
				var wvl_nbr = parseInt(currentSelectedWvl);
				var wvl_match = reply.wvls.indexOf(wvl_nbr);
				$("#wavelength_selector2").val(wvl_match);
  			}
  		}),
   			$.ajax({   //SECOND AJAX CALL
   			url:"/updateCorrel/",
   			data:{selected_pltcode2:$("#ac_pltcodes2").val(),wavelength2:$("#wavelength_selector2").find(":selected").text()},
   			dataType:'json',
   			success: function(reply){
   				corrpanel.html(reply.htmlCorr).fadeIn(500);
   			}
   		});
 	});
});
