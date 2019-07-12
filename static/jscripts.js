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
        hideHmPanel.hide(); 
        hideCorrPanel.hide();

	$.ajax({
		url:"/",
		data:{selected_pltcode:$("#pltcode_selector").find(":selected").text(),wavelength:$("#wavelength_selector").find(":selected").text()},
		dataType:'json'
	});
	//selected_pltcode = $("#wavelength_selector").find(":selected").text();
	//wavelength = $("#wavelength_selector").find(":selected").text();

	//HEATMAP pre 2019 plates
	hideBtn.click(function(e)
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

        formLnPlt.on("submit",function(e)
                {
                e.preventDefault();
                lnpanel.html("<h4><font color='#2152bd'><strong>LOADING...</strong></font></h4>").fadeIn(200);
                $.ajax({
                url:"/updateDf/",
                data:{selected_pltcode:$("#pltcode_selector").find(":selected").text()},
                dataType:'json',
                success: function(reply) {
                    panelHeadLnPlt.html(`<h3>Absorbance Line Plots for: ${reply.pltcode} </h3>`);
                    lnpanel.html(reply.htmlLinePlt).fadeIn(500);
                    hideHmPanel.fadeIn(500);
                                }
                    });
                    return false;
                });

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
