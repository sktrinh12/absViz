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
	var firstPltCd = document.getElementsByTagName("option");
	/*var newWvls = [];
	for (i=220;i<810;i+=10){
			newWvls.push({
			value: `${i}`
	});
	}*/
        hideHmPanel.hide(); 
        hideCorrPanel.hide();
	
	showBtn('hidden-btn',firstPltCd[0]);

	//UPDATE THE HEATMAP BASED ON PRE 2019 PLATECODES:
	hideBtn.click(function(e)
			{
			lnpanel.hide();
			e.preventDefault();
			hmpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
		$.when(
			$.ajax({ //FIRST AJAX CALL
			url:"/updateMain/",
			data:{selected_pltcode:$("#pltcode_selector").find(":selected").text()},
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
			data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#pltcode_selector").find(":selected").text()},
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
	//HEATMAP NORMAL
	formHm.on("submit", function(e)

			{
			e.preventDefault();
			hmpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
			$.ajax({
			url:"/updateHeatmap/",
			data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#pltcode_selector").find(":selected").text()},
			dataType:'json',
			success: function(reply) {
				panelHeadHm.html(`<h3>Heatmap of ${reply.pltcode} at ${reply.selected_wavelength}nm</h3>`);
				$('#innerPanel').html(reply.htmlHeatmap).fadeIn(500);
			hideCorrPanel.fadeIn(500);
							}
				});
				return false;
			});

	//UPDATE LINEPLOT
        formLnPlt.on("submit",function(e)
                {
                e.preventDefault();
                lnpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
		hideHmPanel.hide();
		hideCorrPanel.hide();

		$.when(
			$.ajax({ //FIRST AJAX CALL
			url:"/updateMain/",
			data:{selected_pltcode:$("#pltcode_selector").find(":selected").text()},
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
			data:{wavelength:$("#wavelength_selector").find(":selected").text(),selected_pltcode:$("#pltcode_selector").find(":selected").text()},
			dataType:'json',
			success: function(reply) {
			    panelHeadLnPlt.html(`<h3>Absorbance Line Plots for: ${reply.pltcode} </h3>`);
			    lnpanel.html(reply.htmlLinePlt).fadeIn(500);
			    panelHeadHm.html(`<h3>Heatmap of ${reply.pltcode} at ${reply.selected_wavelength}nm</h3>`);
			    $('#innerPanel').html(reply.htmlHeatmap).fadeIn(500)
	/*		    $('#wavelength_selector').empty();
				$.each(newWvls,function(value) {
					$('#wavelength_selector').append($("<option></option>").attr("value",value).text(newWvls[value]["value"]));
				});
	*/
					}
			    })
		).then(function() {
			    hideHmPanel.fadeIn(500);
			    hideCorrPanel.fadeIn(500);
			});
		});

	//UPDATE CORRELATION TABLE
        formCorr.on("submit", function(e)
            {
                e.preventDefault();
                $.ajax({
                    url:"/updateCorrel/",
                    data:{selected_pltcode2:$("#correl_selector").find(":selected").text(),wavelength2:$("#wavelength_selector2").find(":selected").text()},
                    dataType:'json',
                    success: function(reply){
                        corrpanel.html(reply.htmlCorr).fadeIn(500);
                    }
                });
                return false;
            });
});
