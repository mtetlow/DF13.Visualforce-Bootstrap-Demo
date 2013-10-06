public with sharing class demoPageAssetController {
	public String allAssetsJson{get;set;}
	public demoPageAssetController() {
		setAssets();
	}
	public void setAssets(){
		List<Asset> allAssets = [select Id, ContactId, Contact.Name, AccountId, Account.Name, Product2Id, Product2.Name, IsCompetitorProduct, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, SystemModstamp, IsDeleted, Name, SerialNumber, InstallDate, PurchaseDate, UsageEndDate, Status, Price, Quantity, Description from Asset LIMIT 10000];
		this.allAssetsJson=JSON.serialize(allAssets);
	}

	@RemoteAction
	public static List<sObject> searchContacts(Id accountId, String searchString){
		searchString=String.escapeSingleQuotes(searchString);
		string SOQL = 'SELECT Id,Name FROM Contact WHERE Name LIKE \'%'+searchString+'%\' AND AccountId = :accountId LIMIT 100';
		List<sObject> searchResults = Database.query(SOQL);
		
		return searchResults;
	}

	@RemoteAction
	public static void updateContactOnAsset(Id assetId, Id newContactId){
		List<Asset> assets = [SELECT Id,ContactId FROM Asset WHERE Id = :assetId];
		assets[0].ContactId=newContactId;
		update assets;
	}
}