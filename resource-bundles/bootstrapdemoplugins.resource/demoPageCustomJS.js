if (typeof console === "undefined"){
    console={};
    console.log = function(){
        return;
    }
}

$j = jQuery.noConflict();

$j(document).ready(function(){

	adjustBodyDivHeight();
	processAssetInfo();
	refreshSidebar();
	attachSidebarEventHandlers();
	setDefaultSidebarSelection();
	populateContent();
	attachBodyEventHandlers();
});

$j(window).resize(function(){
	adjustBodyDivHeight();
});

function adjustBodyDivHeight(){
	$j('.bs').height($j(window).height()-200);
}
var uniqueAccounts=[];
var uniqueProducts=[];
var assetsByAccount={};
var assetsByProduct={};
function processAssetInfo(){
	var accounts = {};
	var products = {};
	$j.each(assetInfo,function(index,asset){
		if(assetsByAccount[''] == null){assetsByAccount[''] = [];}
		if(assetsByProduct[''] == null){assetsByProduct[''] = [];}
		if(asset.Account != null){
			accounts[asset.Account.Name]=asset.Account.Name;
			if(assetsByAccount[asset.Account.Name] == null){assetsByAccount[asset.Account.Name] = [];}
			assetsByAccount[asset.Account.Name].push(asset);
		} else{
			assetsByAccount[''].push(asset);
		}
		if(asset.Product2 != null){
			products[asset.Product2.Name]=asset.Product2.Name;
			if(assetsByProduct[asset.Product2.Name] == null){assetsByProduct[asset.Product2.Name] = [];}
			assetsByProduct[asset.Product2.Name].push(asset);
		} else{
			assetsByProduct[''].push(asset);
		}
	});

	var accountArr = $j.map( accounts, function( accountName ) {
		return accountName;
	});
	var productArr = $j.map( products, function( accountName ) {
		return accountName;
	});

	uniqueAccounts = accountArr.sort();
	uniqueProducts = productArr.sort();

}

function refreshSidebar(){
	selectedOption = $j('#sidebar-pivot-sel option:selected').val();
	var ul = $j('<ul class="nav nav-pills nav-stacked">');
  
	if(selectedOption=='Products'){
		$j.each(uniqueProducts,function(index,productName){
			$j(ul).append('<li class=""><a href="#"><span class="badge pull-right">'+assetsByProduct[productName].length+'</span><span class="item-name">'+productName+'</span></a></li>');	
		});
	} else{
		$j.each(uniqueAccounts,function(index,accountName){
			$j(ul).append('<li class=""><a href="#"><span class="badge pull-right">'+assetsByAccount[accountName].length+'</span><span class="item-name">'+accountName+'</span></a></li>');	
		});
	}
	$j('#sidebar-data-container').empty();
	$j('#sidebar-data-container').append(ul);
}

function attachSidebarEventHandlers(){
	$j('#sidebar-data-container').on('click', 'li', function(e){
		$j('#sidebar-data-container ul li.active').removeClass('active');
		$j(e.target).parents('li').addClass('active');
		populateContent();	
	});

	$j('#sidebar-pivot-sel').change(function(){
		refreshSidebar();
		setDefaultSidebarSelection();
		populateContent();
	});
}

function setDefaultSidebarSelection(){
	$j('#sidebar-data-container ul li:first').addClass('active');
}

function populateContent(){
	$j('#asset-table').empty();
	var activeItemName = $j('#sidebar-data-container ul li.active .item-name').text();
	var data = ($j('#sidebar-pivot-sel option:selected').val()=='Products') ? assetsByProduct[activeItemName] : assetsByAccount[activeItemName];
	var rowsToAppend=[];
	rowsToAppend.push($j('<tr><th>Asset Name</th><th>Qty</th><th>Account Name</th><th>Contact Name</th><th>Product Name</th></tr>')[0]);
	$j.each(data,function(index,asset){
		rowsToAppend.push(generateTRFromAsset(asset));
	});

	$j('#asset-table').append(rowsToAppend);
	
}

function generateTRFromAsset(asset){
	var accountName = (asset.Account != null) ? asset.Account.Name : '';
	var productName = (asset.Product2 != null) ? asset.Product2.Name : '';
	var contactName = (asset.Contact != null) ? asset.Contact.Name : '';
	var contactInput = generateLookupForContact(asset);
	return $j('<tr id="'+asset.Id+'"><td>'+asset.Name+'</td><td>'+asset.Quantity+'</td><td>'+accountName+'</td><td><span class="contact_name">'+contactName+'</span><a class="contact_edit" rel="popover" data-html="true" data-content=\''+contactInput+'\'>(edit)</a></td><td>'+productName+'</td></tr>')[0];
}

var tempContactLookup;

function attachBodyEventHandlers(){
	$j('#asset-table').on('click','a.contact_edit,a.popover-save,a.popover-cancel',function(e){
		var clickTarget = $j(e.target);
		if(clickTarget.hasClass('contact_edit')){
			if(clickTarget.siblings('.popover').length > 0){
				clickTarget.popover('destroy');	
			}
			else{
				clickTarget.popover({
					template: '<div class="popover relationship-popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p> </div> <div class="popover-controls"><a class="popover-cancel">Cancel</a></div> </div></div>'
				});
				clickTarget.popover('show');
			}			
		}


		if(clickTarget.hasClass('popover-cancel')){
			$j('.contact_edit').popover('destroy');
		}

		if(clickTarget.hasClass('popover-save')){
			var assetId=clickTarget.parents('tr').attr('id');
			var contactLookup = clickTarget.parent().siblings('.popover-content').find('.contact_lookup');
			var newContactId=contactLookup.attr('newid');
			var newContactName=contactLookup.attr('newname');
			saveContactUpdate(assetId,newContactId,newContactName,function(){$j('.contact_edit').popover('destroy');});
			
		}
	});


	$j('#asset-table').on('shown.bs.popover','.contact_edit',function(){
		$j('.contact_edit').not(this).popover('destroy');
		$j('.contact_lookup').typeahead({
			source: function(query,process) {
				var inputElem = $j(this)[0]['$element'];
				var accountId = inputElem.attr('accountId');
				demoPageAssetController.searchContacts(accountId, query,function(result,event){
					var result_list=[];
					tempContactLookup={};
					$j.each(result,function(index,obj){
						result_list.push(obj.Name);
						tempContactLookup[obj.Name]=obj.Id;
					});
					process(result_list);
				});
			},
			updater: function(item){
				var element = $j(this)[0]['$element'];
				$j(element).attr('newid',tempContactLookup[item]);
				$j(element).attr('newname',item);
				displayUpdateOnPopover(element);
				return item;
			},
			minLength: 3
		});
	});

}

function generateLookupForContact(asset){
	var contactName=(asset.Contact != null) ? asset.Contact.Name : '';
	var retVal=$j('<input accountId="'+asset.AccountId+'" class="contact_lookup" type="text" value="'+contactName+'" />')[0].outerHTML;

	return retVal;
}

function displayUpdateOnPopover(input){
	var popover = $j(input).parents('.popover');
	popover.find('.popover-controls').append('<a class="popover-save">Save</a>');

}

function saveContactUpdate(assetId,newContactId,newContactName,callback){
	demoPageAssetController.updateContactOnAsset(assetId, newContactId, function(result,event){
		$j('#'+assetId).find('.contact_name').text(newContactName);
		if(typeof(callback)=="function"){
			callback();
		}
	});
}